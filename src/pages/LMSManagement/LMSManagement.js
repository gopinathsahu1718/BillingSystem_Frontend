import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import "./LMSManagement.css";
import { useAuth } from "../../context/AuthContext"; // Adjust the import path as needed

const LmsManagement = () => {
  const BASE_URL = 'https://api.hearingzen.in/api';
  const STATIC_BASE = 'https://api.hearingzen.in';
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [editLesson, setEditLesson] = useState(null);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchCourse, setSearchCourse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchLesson, setSearchLesson] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Loading states for form submissions
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  // Form states
  const initialCategoryForm = { name: "", thumbnailFile: null, thumbnailPreview: null };
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);

  const initialCourseForm = {
    title: "",
    description: "",
    category: null,
    thumbnailFile: null,
    thumbnailPreview: null,
    previewVideoFile: null,
    price: "",
    actualPrice: "",
    author: "",
    learnPoints: [],
  };
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [newLearnPoint, setNewLearnPoint] = useState("");

  const initialLessonForm = { title: "", videoUrl: "", category: null, course: null };
  const [lessonForm, setLessonForm] = useState(initialLessonForm);

  const fetchCoursesAndLessons = useCallback(async (currentCategories) => {
    if (!token || !token.trim()) {
      setCourses([]);
      setLessons([]);
      return;
    }

    let apiCoursesData = [];
    let fetchedCourses = [];
    let fetchedLessons = [];

    try {
      const courseResponse = await axios.get(`${BASE_URL}/course/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (courseResponse.data && courseResponse.data.success && courseResponse.data.data && Array.isArray(courseResponse.data.data)) {
        apiCoursesData = courseResponse.data.data;
      } else {
        console.error("Unexpected response format for courses:", courseResponse.data);
        apiCoursesData = [];
      }

      const resolveCategoryName = (course) => {
        let categoryName = 'Uncategorized';
        if (course.category_name) {
          categoryName = course.category_name;
        } else if (course.category_id) {
          const catId = typeof course.category_id === 'string' ? course.category_id : course.category_id?._id;
          const foundCat = currentCategories.find(cat => cat.id === catId);
          if (foundCat) {
            categoryName = foundCat.name;
          }
        }
        return categoryName;
      };

      fetchedCourses = apiCoursesData.map((course) => {
        const categoryName = resolveCategoryName(course);
        return {
          id: course._id,
          title: course.title,
          description: course.description,
          category: categoryName,
          thumbnail: course.thumbnail_image_url ? `${STATIC_BASE}${course.thumbnail_image_url}` : null,
          previewVideo: course.preview_video_url ? `${STATIC_BASE}${course.preview_video_url}` : null,
          price: course.price ? course.price.toString() : "",
          actualPrice: course.actual_price ? course.actual_price.toString() : "",
          author: course.author_name || "",
          learnPoints: course.what_you_learn || [],
          date: new Date(course.createdAt).toLocaleDateString(),
        };
      });

      fetchedLessons = apiCoursesData.flatMap((course) => {
        const categoryName = resolveCategoryName(course);
        return (course.lessons || []).map((lesson) => ({
          id: lesson._id,
          title: lesson.title,
          videoUrl: lesson.video_url,
          course: course.title,
          category: categoryName,
          date: new Date(lesson.createdAt).toLocaleDateString(),
        }));
      });
    } catch (courseError) {
      console.error("Failed to fetch courses:", courseError);
      if (courseError.response?.status === 401) {
        showToast("error", "Unauthorized", "Session expired. Please log in again.");
      } else {
        showToast("error", "Error", "Failed to load courses and lessons.");
      }
      fetchedCourses = [];
      fetchedLessons = [];
    }

    setCourses(fetchedCourses);
    setLessons(fetchedLessons);
  }, [token, STATIC_BASE]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (categoryForm.thumbnailPreview) URL.revokeObjectURL(categoryForm.thumbnailPreview);
      if (courseForm.thumbnailPreview) URL.revokeObjectURL(courseForm.thumbnailPreview);
    };
  }, [categoryForm.thumbnailPreview, courseForm.thumbnailPreview]);

  // Fetch categories, courses, and lessons on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !token.trim()) {
        console.warn("No valid token available. Skipping fetch.");
        setLoadingCategories(false);
        return;
      }

      try {
        setLoadingCategories(true);
        let fetchedCategories = [];

        try {
          const catResponse = await axios.get(`${BASE_URL}/course/categories`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          let apiData = [];
          if (catResponse.data && catResponse.data.success && catResponse.data.data && Array.isArray(catResponse.data.data)) {
            apiData = catResponse.data.data;
          } else {
            console.error("Unexpected response format:", catResponse.data);
            apiData = [];
          }

          fetchedCategories = apiData
            .map((item) => item.category)
            .filter((cat) => cat && typeof cat.name === 'string' && cat.name.trim() !== '')
            .map((cat) => ({
              id: cat._id,
              name: cat.name,
              thumbnail: cat.thumbnail_image_url ? `${STATIC_BASE}${cat.thumbnail_image_url}` : null,
              date: new Date(cat.createdAt).toLocaleDateString(),
            }));
        } catch (catError) {
          console.error("Failed to fetch categories:", catError);
          if (catError.response?.status === 401) {
            showToast("error", "Unauthorized", "Session expired. Please log in again.");
          } else {
            showToast("error", "Error", "Failed to load categories. Proceeding with courses.");
          }
          fetchedCategories = [];
        }

        setCategories(fetchedCategories);
        await fetchCoursesAndLessons(fetchedCategories);
      } catch (error) {
        console.error("Critical fetch error:", error);
        showToast("error", "Error", "Network error. Please check your connection and try again.");
        setCategories([]);
        setCourses([]);
        setLessons([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [token, STATIC_BASE, fetchCoursesAndLessons]);

  const showToast = (type, title, description) => {
    setToasts([]);
    const id = Date.now();
    setToasts([{ id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const handleCategoryChange = (e) => {
    const { name, files, value } = e.target;
    if (name === "thumbnail" && files && files[0]) {
      if (files[0].size > 1 * 1024 * 1024) {
        showToast("error", "Error", "Thumbnail image size exceeds 1MB limit.");
        return;
      }
      if (!files[0].type.startsWith("image/")) {
        showToast("error", "Error", "Please upload a valid image file.");
        return;
      }
      const file = files[0];
      if (categoryForm.thumbnailPreview) {
        URL.revokeObjectURL(categoryForm.thumbnailPreview);
      }
      const preview = URL.createObjectURL(file);
      setCategoryForm({ ...categoryForm, thumbnailFile: file, thumbnailPreview: preview });
    } else {
      if (name === "name" && !/^[A-Za-z0-9\s-]*$/.test(value)) {
        return;
      }
      setCategoryForm({ ...categoryForm, [name]: value });
    }
  };

  const handleCourseChange = (selectedOption) => {
    setCourseForm({ ...courseForm, category: selectedOption ? selectedOption.value : null });
  };

  const handleCourseOtherChange = (e) => {
    const { name, files, value } = e.target;
    if ((name === "thumbnail" || name === "previewVideo") && files && files[0]) {
      const maxSize = name === "thumbnail" ? 1 * 1024 * 1024 : 1 * 1024 * 1024;
      if (files[0].size > maxSize) {
        showToast("error", "Error", `${name === "thumbnail" ? "Thumbnail" : "Preview video"} size exceeds ${name === "thumbnail" ? "1MB" : "1MB"} limit.`);
        return;
      }
      if (name === "thumbnail" && !files[0].type.startsWith("image/")) {
        showToast("error", "Error", "Please upload a valid image file for thumbnail.");
        return;
      }
      if (name === "previewVideo" && !files[0].type.startsWith("video/")) {
        showToast("error", "Error", "Please upload a valid video file for preview.");
        return;
      }
      const file = files[0];
      if (name === "thumbnail") {
        if (courseForm.thumbnailPreview) {
          URL.revokeObjectURL(courseForm.thumbnailPreview);
        }
        const preview = URL.createObjectURL(file);
        setCourseForm({ ...courseForm, thumbnailFile: file, thumbnailPreview: preview });
      } else {
        setCourseForm({ ...courseForm, previewVideoFile: file });
      }
    } else if (name === "price" || name === "actualPrice") {
      if (/^\d*$/.test(value)) {
        setCourseForm({ ...courseForm, [name]: value });
      }
    } else if (name === "title" || name === "author") {
      if (!/^[A-Za-z0-9\s-]*$/.test(value)) {
        return;
      }
      setCourseForm({ ...courseForm, [name]: value });
    } else {
      setCourseForm({ ...courseForm, [name]: value });
    }
  };

  const addLearnPoint = () => {
    if (newLearnPoint.trim() && /^[A-Za-z0-9\s-.,!?]*$/.test(newLearnPoint)) {
      setCourseForm({
        ...courseForm,
        learnPoints: [newLearnPoint.trim(), ...courseForm.learnPoints],
      });
      setNewLearnPoint("");
    } else if (newLearnPoint.trim()) {
      showToast("error", "Error", "Learning point contains invalid characters.");
    }
  };

  const removeLearnPoint = (index) => {
    setCourseForm({
      ...courseForm,
      learnPoints: courseForm.learnPoints.filter((_, i) => i !== index),
    });
  };

  const handleLessonChange = (field, selectedOption) => {
    setLessonForm({ ...lessonForm, [field]: selectedOption ? selectedOption.value : null });
    if (field === "category") {
      setLessonForm((prev) => ({ ...prev, course: null }));
    }
  };

  const handleLessonOtherChange = (e) => {
    const { name, value } = e.target;
    if (name === "title" && value && !/^[A-Za-z0-9\s-]*$/.test(value)) {
      return;
    }
    setLessonForm({ ...lessonForm, [name]: value });
  };

  const isDuplicateCategory = (name, editItem) => {
    return categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== (editItem?.id || null));
  };

  const isDuplicateCourse = (title, editItem) => {
    return courses.some((c) => c.title.toLowerCase() === title.toLowerCase() && c.id !== (editItem?.id || null));
  };

  const isDuplicateLesson = (title, editItem) => {
    return lessons.some((l) => l.title.toLowerCase() === title.toLowerCase() && l.id !== (editItem?.id || null));
  };

  const validateUrl = (url) => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
      '((\\d{1,3}\\.){3}\\d{1,3}))' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$', 'i'
    );
    return !!pattern.test(url);
  };

  const handleAddCategory = async () => {
    if (!token || !token.trim()) {
      showToast("error", "Unauthorized", "Please log in to add a category.");
      return;
    }
    if (!categoryForm.name.trim()) {
      showToast("error", "Error", "Category name is required.");
      return;
    }
    // Only require thumbnail for new categories, not edits
    if (!editCategory && !categoryForm.thumbnailFile) {
      showToast("error", "Error", "Thumbnail image is required.");
      return;
    }
    if (isDuplicateCategory(categoryForm.name, editCategory)) {
      showToast("error", "Error", "Duplicate category name.");
      return;
    }

    setIsSubmittingCategory(true);
    try {
      const formData = new FormData();
      formData.append('name', categoryForm.name.trim());

      if (categoryForm.thumbnailFile) {
        formData.append('thumbnail', categoryForm.thumbnailFile);
      }

      let apiResponse;
      if (editCategory) {
        apiResponse = await axios.put(
          `${BASE_URL}/course/categories/${editCategory.id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        apiResponse = await axios.post(
          `${BASE_URL}/course/categories`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      if (apiResponse.data && apiResponse.data.success) {
        const updatedCategory = apiResponse.data.data;
        const newCategory = {
          id: updatedCategory._id || editCategory?.id,
          name: updatedCategory.name,
          thumbnail: updatedCategory.thumbnail_image_url ? `${STATIC_BASE}${updatedCategory.thumbnail_image_url}` : (categoryForm.thumbnailPreview || null),
          date: new Date(updatedCategory.updatedAt || updatedCategory.createdAt).toLocaleDateString(),
        };

        if (editCategory) {
          setCategories(categories.map((cat) => (cat.id === editCategory.id ? newCategory : cat)));
          showToast("success", "Success", "Category updated successfully.");
        } else {
          setCategories([...categories, newCategory]);
          showToast("success", "Success", "Category added successfully.");
        }
      } else {
        throw new Error("Unexpected API response");
      }

      setEditCategory(null);
      setCategoryForm(initialCategoryForm);
      setShowCategoryForm(false);
    } catch (error) {
      console.error("Failed to save category:", error);
      let errorMsg = `Failed to ${editCategory ? 'update' : 'add'} category. Please try again.`;
      if (error.code === 'ERR_NETWORK' || error.response?.status === 413) {
        errorMsg = 'Request too large or network issue (CORS/413). Check file sizes and server configuration.';
      } else if (error.response?.status === 401) {
        errorMsg = "Unauthorized. Please log in again.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      showToast("error", "Error", errorMsg);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleEditCategory = async (category) => {
    setShowCategoryForm(true);
    if (!category.id || !token) {
      setEditCategory(category);
      // Extract filename from URL if exists
      let originalFilename = "Current thumbnail";
      if (category.thumbnail) {
        const urlParts = category.thumbnail.split('/');
        originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
      }
      setCategoryForm({
        name: category.name || "",
        thumbnailFile: category.thumbnail ? { name: originalFilename } : null,
        thumbnailPreview: category.thumbnail || null
      });
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/course/categories/${category.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let fetchedCategory;
      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;
        if (data && data.category && typeof data.category === 'object') {
          fetchedCategory = data.category;
        } else if (typeof data === 'object' && !Array.isArray(data)) {
          fetchedCategory = data;
        } else {
          throw new Error("Unexpected data structure in response");
        }
      } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        fetchedCategory = response.data;
      } else {
        console.error("Unexpected response format:", response.data);
        throw new Error("Unexpected response format");
      }

      if (!fetchedCategory || !fetchedCategory.name || typeof fetchedCategory.name !== 'string' || !fetchedCategory.name.trim()) {
        console.warn("Invalid or missing name in fetched category:", fetchedCategory);
        throw new Error("Invalid category data received");
      }

      const mappedCategory = {
        id: fetchedCategory._id || category.id,
        name: fetchedCategory.name,
        thumbnail: fetchedCategory.thumbnail_image_url ? `${STATIC_BASE}${fetchedCategory.thumbnail_image_url}` : (category.thumbnail || null),
        date: new Date(fetchedCategory.createdAt || fetchedCategory.updatedAt || Date.now()).toLocaleDateString(),
      };

      setCategories(prev => prev.map(cat => cat.id === mappedCategory.id ? mappedCategory : cat));
      setEditCategory(mappedCategory);

      // Extract filename from URL
      let originalFilename = "Current thumbnail";
      if (mappedCategory.thumbnail) {
        const urlParts = mappedCategory.thumbnail.split('/');
        originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
      }

      setCategoryForm({
        name: mappedCategory.name,
        thumbnailFile: mappedCategory.thumbnail ? { name: originalFilename } : null,
        thumbnailPreview: mappedCategory.thumbnail,
      });
    } catch (error) {
      console.error("Failed to fetch category details:", error);
      let errorMsg = "Failed to fetch category details. Using local data.";
      if (error.response?.status === 401) {
        errorMsg = "Unauthorized. Please log in again.";
      }
      showToast("error", "Error", errorMsg);
      setEditCategory(category);

      // Extract filename from URL
      let originalFilename = "Current thumbnail";
      if (category.thumbnail) {
        const urlParts = category.thumbnail.split('/');
        originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
      }

      setCategoryForm({
        name: category.name || "",
        thumbnailFile: category.thumbnail ? { name: originalFilename } : null,
        thumbnailPreview: category.thumbnail || null
      });
    }
  };

  const prepareRemoveCategory = (category) => {
    setItemToDelete(category);
    setDeleteType("category");
    setShowDeleteModal(true);
  };

  const confirmRemove = async () => {
    if (!token || !token.trim()) {
      showToast("error", "Unauthorized", "Please log in to delete.");
      setShowDeleteModal(false);
      return;
    }

    try {
      if (deleteType === "category") {
        const apiResponse = await axios.delete(
          `${BASE_URL}/course/categories/${itemToDelete.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (apiResponse.data && apiResponse.data.success) {
          const categoryName = itemToDelete.name;
          setCategories(categories.filter((cat) => cat.id !== itemToDelete.id));
          setCourses(courses.filter((course) => course.category !== categoryName));
          setLessons(lessons.filter((lesson) => lesson.category !== categoryName));
          showToast("success", "Success", "Category and related courses and lessons deleted successfully.");
        } else {
          throw new Error("Unexpected API response");
        }
      } else if (deleteType === "course") {
        const apiResponse = await axios.delete(
          `${BASE_URL}/course/courses/${itemToDelete.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (apiResponse.data && apiResponse.data.success) {
          const courseTitle = itemToDelete.title;
          setCourses(courses.filter((c) => c.id !== itemToDelete.id));
          setLessons(lessons.filter((lesson) => lesson.course !== courseTitle));
          showToast("success", "Success", "Course and related lessons deleted successfully.");
        } else {
          throw new Error("Unexpected API response");
        }
      } else if (deleteType === "lesson") {
        const apiResponse = await axios.delete(
          `${BASE_URL}/course/lessons/${itemToDelete.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (apiResponse.data && apiResponse.data.success) {
          showToast("success", "Success", "Lesson deleted successfully.");
          await fetchCoursesAndLessons(categories);
        } else {
          throw new Error("Unexpected API response");
        }
      }

      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType(null);
    } catch (error) {
      console.error("Failed to delete:", error);
      let errorMsg = error.response?.data?.message || `Failed to delete ${deleteType}. Please try again.`;
      if (error.response?.status === 401) {
        errorMsg = "Unauthorized. Please log in again.";
      }
      showToast("error", "Error", errorMsg);
      setShowDeleteModal(false);
    }
  };

  const calculateDiscount = (price, actualPrice) => {
    const p = parseFloat(price);
    const a = parseFloat(actualPrice);
    if (!p || !a || p >= a || isNaN(p) || isNaN(a)) return 0;
    return Math.round(((a - p) / a) * 100);
  };

  const handleAddCourse = async () => {
    if (!token || !token.trim()) {
      showToast("error", "Unauthorized", "Please log in to add a course.");
      return;
    }
    if (!courseForm.title.trim() || !courseForm.category || !courseForm.description.trim() || !courseForm.price || !courseForm.actualPrice || !courseForm.author.trim()) {
      showToast("error", "Error", "All mandatory fields are required.");
      return;
    }
    // Only require thumbnail for new courses, not edits
    if (!editCourse && !courseForm.thumbnailFile) {
      showToast("error", "Error", "Thumbnail image is required.");
      return;
    }
    const priceVal = parseFloat(courseForm.price);
    const actualVal = parseFloat(courseForm.actualPrice);
    if (isNaN(priceVal) || isNaN(actualVal) || priceVal >= actualVal) {
      showToast("error", "Error", "Price must be less than Actual Price.");
      return;
    }
    if (isDuplicateCourse(courseForm.title, editCourse)) {
      showToast("error", "Error", "Duplicate course title.");
      return;
    }

    setIsSubmittingCourse(true);
    try {
      const formData = new FormData();
      formData.append('title', courseForm.title.trim());
      formData.append('description', courseForm.description.trim());
      formData.append('category_id', courseForm.category);
      formData.append('price', parseFloat(courseForm.price));
      formData.append('actual_price', parseFloat(courseForm.actualPrice));
      formData.append('author_name', courseForm.author.trim());

      if (courseForm.learnPoints && courseForm.learnPoints.length > 0) {
        formData.append('what_you_learn', JSON.stringify(courseForm.learnPoints));
      }
      if (courseForm.thumbnailFile) {
        formData.append('thumbnail', courseForm.thumbnailFile);
      }
      if (courseForm.previewVideoFile) {
        formData.append('video', courseForm.previewVideoFile);
      }

      let apiResponse;
      if (editCourse) {
        apiResponse = await axios.put(
          `${BASE_URL}/course/courses/${editCourse.id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (apiResponse.data && apiResponse.data.success) {
          const updatedCourse = apiResponse.data.data;

          let categoryName = 'Uncategorized';

          if (updatedCourse.category_id?.name) {
            categoryName = updatedCourse.category_id.name;
          } else if (updatedCourse.category_id?._id) {
            const foundCat = categories.find(cat => cat.id === updatedCourse.category_id._id);
            if (foundCat) {
              categoryName = foundCat.name;
            }
          } else {
            const foundCat = categories.find(cat => cat.id === courseForm.category);
            if (foundCat) {
              categoryName = foundCat.name;
            }
          }

          const mappedCourse = {
            id: updatedCourse._id || editCourse.id,
            title: updatedCourse.title,
            description: updatedCourse.description,
            category: categoryName,
            thumbnail: updatedCourse.thumbnail_image_url ? `${STATIC_BASE}${updatedCourse.thumbnail_image_url}` : courseForm.thumbnailPreview,
            previewVideo: updatedCourse.preview_video_url ? `${STATIC_BASE}${updatedCourse.preview_video_url}` : null,
            price: updatedCourse.price ? updatedCourse.price.toString() : "",
            actualPrice: updatedCourse.actual_price ? updatedCourse.actual_price.toString() : "",
            author: updatedCourse.author_name || editCourse.author,
            learnPoints: updatedCourse.what_you_learn || editCourse.learnPoints,
            date: new Date(updatedCourse.updatedAt || updatedCourse.createdAt).toLocaleDateString(),
          };

          setCourses(courses.map((c) => (c.id === editCourse.id ? mappedCourse : c)));
          showToast("success", "Success", "Course updated successfully.");
          setEditCourse(null);
        } else {
          throw new Error("Unexpected API response");
        }
      } else {
        apiResponse = await axios.post(
          `${BASE_URL}/course/courses`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (apiResponse.data && apiResponse.data.success) {
          const createdCourse = apiResponse.data.data;

          let categoryName = 'Uncategorized';

          if (createdCourse.category_id?.name) {
            categoryName = createdCourse.category_id.name;
          } else if (createdCourse.category_id?._id) {
            const foundCat = categories.find(cat => cat.id === createdCourse.category_id._id);
            if (foundCat) {
              categoryName = foundCat.name;
            }
          } else if (typeof createdCourse.category_id === 'string') {
            const foundCat = categories.find(cat => cat.id === createdCourse.category_id);
            if (foundCat) {
              categoryName = foundCat.name;
            }
          } else {
            const foundCat = categories.find(cat => cat.id === courseForm.category);
            if (foundCat) {
              categoryName = foundCat.name;
            }
          }

          const newCourse = {
            id: createdCourse._id,
            title: createdCourse.title,
            description: createdCourse.description,
            category: categoryName,
            thumbnail: createdCourse.thumbnail_image_url ? `${STATIC_BASE}${createdCourse.thumbnail_image_url}` : null,
            previewVideo: createdCourse.preview_video_url ? `${STATIC_BASE}${createdCourse.preview_video_url}` : null,
            price: createdCourse.price ? createdCourse.price.toString() : "",
            actualPrice: createdCourse.actual_price ? createdCourse.actual_price.toString() : "",
            author: createdCourse.author_name || courseForm.author,
            learnPoints: createdCourse.what_you_learn || [],
            date: new Date(createdCourse.createdAt).toLocaleDateString(),
          };

          setCourses([...courses, newCourse]);
          showToast("success", "Success", "Course added successfully.");
        } else {
          throw new Error("Unexpected API response");
        }
      }

      setCourseForm(initialCourseForm);
      setNewLearnPoint("");
      setShowCourseForm(false);
    } catch (error) {
      console.error("Failed to save course:", error);
      let errorMsg = `Failed to ${editCourse ? 'update' : 'add'} course. Please try again.`;
      if (error.code === 'ERR_NETWORK' || error.response?.status === 413) {
        errorMsg = 'Request too large or network issue (CORS/413). Reduce file sizes or check server limits.';
      } else if (error.response?.status === 401) {
        errorMsg = "Unauthorized. Please log in again.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      showToast("error", "Error", errorMsg);
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleEditCourse = async (course) => {
    setShowCourseForm(true);
    if (!course.id || !token) {
      const categoryId = categories.find(cat => cat.name === course.category)?.id || course.category;

      // Extract filename from URL if exists
      let originalFilename = "Current thumbnail";
      if (course.thumbnail) {
        const urlParts = course.thumbnail.split('/');
        originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
      }

      setEditCourse(course);
      setCourseForm({
        ...course,
        category: categoryId,
        learnPoints: course.learnPoints || [],
        thumbnailFile: course.thumbnail ? { name: originalFilename } : null,
        thumbnailPreview: course.thumbnail || null,
        previewVideoFile: null
      });
      setNewLearnPoint("");
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/course/courses/${course.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let fetchedCourse;
      if (response.data && response.data.success && response.data.data) {
        fetchedCourse = response.data.data;
      } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        fetchedCourse = response.data;
      } else {
        console.error("Unexpected response format:", response.data);
        throw new Error("Unexpected response format");
      }

      if (!fetchedCourse || !fetchedCourse.title || typeof fetchedCourse.title !== 'string' || !fetchedCourse.title.trim()) {
        console.warn("Invalid or missing title in fetched course:", fetchedCourse);
        throw new Error("Invalid course data received");
      }

      let categoryName = fetchedCourse.category_name || (fetchedCourse.category && fetchedCourse.category.name) || course.category;
      let categoryId = fetchedCourse.category?._id || categories.find(cat => cat.name === categoryName)?.id || course.category;

      const mappedCourse = {
        id: fetchedCourse._id || course.id,
        title: fetchedCourse.title,
        description: fetchedCourse.description || "",
        category: categoryName,
        thumbnail: fetchedCourse.thumbnail_image_url ? `${STATIC_BASE}${fetchedCourse.thumbnail_image_url}` : (course.thumbnail || null),
        previewVideo: fetchedCourse.preview_video_url ? `${STATIC_BASE}${fetchedCourse.preview_video_url}` : (course.previewVideo || null),
        price: fetchedCourse.price ? fetchedCourse.price.toString() : "",
        actualPrice: fetchedCourse.actual_price ? fetchedCourse.actual_price.toString() : "",
        author: fetchedCourse.author_name || fetchedCourse.author || course.author || "",
        learnPoints: fetchedCourse.what_you_learn || course.learnPoints || [],
        date: new Date(fetchedCourse.createdAt || fetchedCourse.updatedAt || Date.now()).toLocaleDateString(),
      };

      setCourses(prev => prev.map(c => c.id === mappedCourse.id ? mappedCourse : c));
      setEditCourse(mappedCourse);

      // Extract filename from URL
      let originalFilename = "Current thumbnail";
      if (mappedCourse.thumbnail) {
        const urlParts = mappedCourse.thumbnail.split('/');
        originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
      }

      setCourseForm({
        title: mappedCourse.title,
        description: mappedCourse.description,
        category: categoryId,
        thumbnailFile: mappedCourse.thumbnail ? { name: originalFilename } : null,
        thumbnailPreview: mappedCourse.thumbnail,
        previewVideoFile: null,
        price: mappedCourse.price,
        actualPrice: mappedCourse.actualPrice,
        author: mappedCourse.author,
        learnPoints: mappedCourse.learnPoints,
      });
      setNewLearnPoint("");
    } catch (error) {
      console.error("Failed to fetch course details:", error);
      let errorMsg = "Failed to fetch course details. Using local data.";
      if (error.response?.status === 401) {
        errorMsg = "Unauthorized. Please log in again.";
      }
      showToast("error", "Error", errorMsg);
      const categoryId = categories.find(cat => cat.name === course.category)?.id || course.category;

      // Extract filename from URL
      let originalFilename = "Current thumbnail";
      if (course.thumbnail) {
        const urlParts = course.thumbnail.split('/');
        originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
      }

      setEditCourse(course);
      setCourseForm({
        ...course,
        category: categoryId,
        learnPoints: course.learnPoints || [],
        thumbnailFile: course.thumbnail ? { name: originalFilename } : null,
        thumbnailPreview: course.thumbnail || null,
        previewVideoFile: null
      });
      setNewLearnPoint("");
    }
  };

  const prepareRemoveCourse = (course) => {
    setItemToDelete(course);
    setDeleteType("course");
    setShowDeleteModal(true);
  };

  const handleAddLesson = async () => {
    if (!token || !token.trim()) {
      showToast("error", "Unauthorized", "Please log in to add a lesson.");
      return;
    }
    if (!lessonForm.title.trim() || !lessonForm.category || !lessonForm.course || !lessonForm.videoUrl.trim()) {
      showToast("error", "Error", "All mandatory fields are required.");
      return;
    }
    if (!validateUrl(lessonForm.videoUrl)) {
      showToast("error", "Error", "Invalid Video URL. Ensure it is a valid URL.");
      return;
    }
    if (isDuplicateLesson(lessonForm.title, editLesson)) {
      showToast("error", "Error", "Duplicate lesson title.");
      return;
    }

    const courseId = courses.find(c => c.title === lessonForm.course)?.id;
    if (!courseId) {
      showToast("error", "Error", "Selected course not found.");
      return;
    }

    setIsSubmittingLesson(true);
    try {
      const payload = {
        title: lessonForm.title.trim(),
        video_url: lessonForm.videoUrl.trim(),
        course_id: courseId
      };

      let apiResponse;
      if (editLesson) {
        apiResponse = await axios.put(
          `${BASE_URL}/course/lessons/${editLesson.id}`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        apiResponse = await axios.post(
          `${BASE_URL}/course/lessons`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (apiResponse.data && apiResponse.data.success) {
        showToast("success", "Success", `${editLesson ? "Lesson updated" : "Lesson added"} successfully.`);
        await fetchCoursesAndLessons(categories);
        setLessonForm(initialLessonForm);
        setShowLessonForm(false);
        setEditLesson(null);
      } else {
        throw new Error("Unexpected API response");
      }
    } catch (error) {
      console.error("Failed to save lesson:", error);
      let errorMsg = `Failed to ${editLesson ? 'update' : 'add'} lesson. Please try again.`;
      if (error.response?.status === 401) {
        errorMsg = "Unauthorized. Please log in again.";
      } else if (error.response?.status === 500) {
        errorMsg = error.response?.data?.message || "Server error. Please check if the video URL is valid and try again.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      showToast("error", "Error", errorMsg);
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  const handleEditLesson = (lesson) => {
    setEditLesson(lesson);
    setLessonForm({ ...lesson });
    setShowLessonForm(true);
  };

  const prepareRemoveLesson = (lesson) => {
    setItemToDelete(lesson);
    setDeleteType("lesson");
    setShowDeleteModal(true);
  };

  const filteredCategories = categories.filter((cat) =>
    cat && cat.name && cat.name.toLowerCase().includes(searchCategory.toLowerCase())
  );

  const filteredCourses = courses.filter(
    (c) =>
      c && c.title && c.title.toLowerCase().includes(searchCourse.toLowerCase()) &&
      (!selectedCategory || c.category === selectedCategory.value)
  );

  const filteredLessons = lessons.filter(
    (l) =>
      l && l.title && l.title.toLowerCase().includes(searchLesson.toLowerCase()) &&
      (!selectedCourseFilter || l.course === selectedCourseFilter.value)
  );

  const categoryNameOptions = categories
    .filter(cat => cat && cat.name)
    .map((cat) => ({
      value: cat.name,
      label: cat.name,
    }));

  const categoryIdOptions = categories
    .filter(cat => cat && cat.name)
    .map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));

  const courseOptions = lessonForm.category
    ? courses
      .filter((c) => c && c.category === lessonForm.category)
      .map((c) => ({ value: c.title, label: c.title }))
    : courses
      .filter(c => c && c.title)
      .map((c) => ({ value: c.title, label: c.title }));

  const courseFilterOptions = courses
    .filter(c => c && c.title)
    .map((c) => ({ value: c.title, label: c.title }));

  const getBreadcrumbs = () => {
    let path = "LMS Management";
    if (activeTab === "categories") path += " > Categories";
    else if (activeTab === "courses") path += " > Courses";
    else if (activeTab === "lessons") path += " > Lessons";
    return path;
  };

  const handleNewLearnPointChange = (e) => {
    const value = e.target.value;
    if (/^[A-Za-z0-9\s-.,!?]*$/.test(value)) {
      setNewLearnPoint(value);
    }
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "36px",
      borderRadius: "10px",
      borderColor: "#9ca3af",
      backgroundColor: "#ffffff",
      color: "#111827",
      "&:hover": {
        borderColor: "#4b5e6f",
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#111827",
      fontSize: "0.8rem",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#4b5e6f",
      fontSize: "0.8rem",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#ffffff",
      color: "#111827",
      border: "1px solid #9ca3af",
      zIndex: 100,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#9ca3af"
        : state.isFocused
          ? "#e5e7eb"
          : "#ffffff",
      color: "#111827",
      fontSize: "0.8rem",
      "&:hover": {
        backgroundColor: "#e5e7eb",
      }
    })
  };

  const clearCurrentFilters = () => {
    if (activeTab === "categories") {
      setSearchCategory("");
    } else if (activeTab === "courses") {
      setSearchCourse("");
      setSelectedCategory(null);
    } else if (activeTab === "lessons") {
      setSearchLesson("");
      setSelectedCourseFilter(null);
    }
  };

  const renderNoResults = (entity) => (
    <div className="no-results-card">
      <i className="bi bi-search no-results-icon"></i>
      <p className="no-results-text">
        No {entity} found matching your search criteria.
      </p>
      <button className="btn-clear-filters" onClick={clearCurrentFilters}>
        <i className="bi bi-x-circle me-1"></i>
        Clear Search
      </button>
    </div>
  );

  const renderCategories = () => (
    <>
      <div className="lms-controls">
        <div className="lms-header">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            className="search-input"
          />
          <button
            className="btn-add"
            onClick={() => {
              setEditCategory(null);
              setCategoryForm(initialCategoryForm);
              setShowCategoryForm(true);
            }}
          >
            + Add Category
          </button>
        </div>
      </div>

      {showCategoryForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className="bi bi-folder-plus"></i>
                {editCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button className="modal-close" onClick={() => {
                if (categoryForm.thumbnailPreview) URL.revokeObjectURL(categoryForm.thumbnailPreview);
                setShowCategoryForm(false);
                setEditCategory(null);
                setCategoryForm(initialCategoryForm);
              }}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <div className="form-section-title">
                  <i className="bi bi-info-circle"></i>
                  Category Information
                </div>
                <div className="form-group">
                  <label>
                    <i className="bi bi-tag"></i>
                    Category Name <span className="mandatory">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      name="name"
                      placeholder="e.g., Web Development, Sign Language"
                      value={categoryForm.name}
                      onChange={handleCategoryChange}
                      required
                      maxLength={100}
                      pattern="[A-Za-z0-9 \-]+"
                      title="Only letters, numbers, spaces, and hyphens allowed"
                    />
                    <span className="char-count">{categoryForm.name.length}/100</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <i className="bi bi-image"></i>
                    Thumbnail Image <span className="mandatory">*</span>
                  </label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      name="thumbnail"
                      accept="image/*"
                      onChange={handleCategoryChange}
                      className="file-input-hidden"
                      id="category-thumbnail-input"
                    />
                    <label htmlFor="category-thumbnail-input" className="file-input-label">
                      <span className="file-input-text">
                        {categoryForm.thumbnailFile ? categoryForm.thumbnailFile.name : "Choose an image file (max 1MB)"}
                      </span>
                      {categoryForm.thumbnailPreview && (
                        <div className="thumbnail-preview-inline">
                          <img src={categoryForm.thumbnailPreview} alt="Preview" />
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  if (categoryForm.thumbnailPreview) URL.revokeObjectURL(categoryForm.thumbnailPreview);
                  setShowCategoryForm(false);
                  setEditCategory(null);
                  setCategoryForm(initialCategoryForm);
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddCategory} disabled={isSubmittingCategory}>
                <i className="bi bi-check-circle me-1"></i>
                {editCategory ? "Update Category" : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingCategories && (
        <div className="loading-container">
          <i className="bi bi-hourglass-split"></i>
          <p>Loading categories...</p>
        </div>
      )}

      {!loadingCategories && filteredCategories.length === 0 ? (
        renderNoResults("categories")
      ) : (
        !loadingCategories && (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Thumbnail</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat, i) => (
                  <tr key={cat.id || i}>
                    <td data-label="#">{i + 1}</td>
                    <td data-label="Name">{cat.name}</td>
                    <td data-label="Thumbnail">
                      {cat.thumbnail ? (
                        <img src={cat.thumbnail} alt={cat.name} width="50" className="category-thumbnail" />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td data-label="Created Date">{cat.date}</td>
                    <td data-label="Actions">
                      <button className="btn-edit" onClick={() => handleEditCategory(cat)}>
                        Edit
                      </button>
                      <button
                        className="btn-remove"
                        onClick={() => prepareRemoveCategory(cat)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </>
  );

  const renderCourses = () => (
    <>
      <div className="lms-controls">
        <div className="lms-header">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchCourse}
            onChange={(e) => setSearchCourse(e.target.value)}
            className="search-input"
          />
          <Select
            className="filter-select"
            options={categoryNameOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="All Categories"
            isClearable
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <button
            className="btn-add"
            onClick={() => {
              setEditCourse(null);
              setCourseForm(initialCourseForm);
              setShowCourseForm(true);
            }}
          >
            + Add Course
          </button>
        </div>
      </div>

      {showCourseForm && (
        <div className="modal-overlay">
          <div className="modal-content course-modal-no-scroll">
            <div className="modal-header">
              <h3>
                <i className="bi bi-journal-plus"></i>
                {editCourse ? "Edit Course" : "Add New Course"}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  if (courseForm.thumbnailPreview) URL.revokeObjectURL(courseForm.thumbnailPreview);
                  setShowCourseForm(false);
                  setEditCourse(null);
                  setCourseForm(initialCourseForm);
                  setNewLearnPoint("");
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="course-form-container">
                {/* Basic Information Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-info-circle"></i>
                    Basic Information
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-card-heading"></i>
                        Course Title <span className="mandatory">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="title"
                          placeholder="e.g., Complete Sign Language Course"
                          value={courseForm.title}
                          onChange={handleCourseOtherChange}
                          maxLength={100}
                        />
                        <span className="char-count">{courseForm.title.length}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-text-paragraph"></i>
                        Description <span className="mandatory">*</span>
                      </label>
                      <div className="input-wrapper">
                        <textarea
                          name="description"
                          placeholder="Brief description of the course"
                          value={courseForm.description}
                          onChange={handleCourseOtherChange}
                          maxLength={100}
                          rows={3}
                        />
                        <span className="char-count">{courseForm.description.length}/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category and Pricing Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-tags"></i>
                    Category & Pricing
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-folder"></i>
                        Category <span className="mandatory">*</span>
                      </label>
                      <Select
                        className="filter-select"
                        options={categoryIdOptions}
                        value={categoryIdOptions.find((option) => option.value === courseForm.category) || null}
                        onChange={handleCourseChange}
                        placeholder="Select a category"
                        isClearable
                        styles={selectStyles}
                      />
                    </div>
                  </div>

                  <div className="form-row three-col">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-currency-rupee"></i>
                        Selling Price <span className="mandatory">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="price"
                          type="number"
                          placeholder="₹499"
                          value={courseForm.price}
                          onChange={handleCourseOtherChange}
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-tag"></i>
                        Original Price <span className="mandatory">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="actualPrice"
                          type="number"
                          placeholder="₹999"
                          value={courseForm.actualPrice}
                          onChange={handleCourseOtherChange}
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-percent"></i>
                        Discount
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          value={`${calculateDiscount(courseForm.price, courseForm.actualPrice)}%`}
                          disabled
                          style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Author and Media Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-person-badge"></i>
                    Author & Media
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-person"></i>
                        Author Name <span className="mandatory">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="author"
                          placeholder="e.g., Dr. John Smith"
                          value={courseForm.author}
                          onChange={handleCourseOtherChange}
                          maxLength={50}
                        />
                        <span className="char-count">{courseForm.author.length}/50</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-image"></i>
                        Thumbnail Image <span className="mandatory">*</span>
                      </label>
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          name="thumbnail"
                          accept="image/*"
                          onChange={handleCourseOtherChange}
                          className="file-input-hidden"
                          id="course-thumbnail-input"
                        />
                        <label htmlFor="course-thumbnail-input" className="file-input-label">
                          <span className="file-input-text">
                            {courseForm.thumbnailFile ? courseForm.thumbnailFile.name : "Choose thumbnail (max 1MB)"}
                          </span>
                          {courseForm.thumbnailPreview && (
                            <div className="thumbnail-preview-inline">
                              <img src={courseForm.thumbnailPreview} alt="Preview" />
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-play-circle"></i>
                        Preview Video <span className="mandatory">*</span>
                      </label>
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          name="previewVideo"
                          accept="video/*"
                          onChange={handleCourseOtherChange}
                          className="file-input-hidden"
                          id="course-video-input"
                        />
                        <label htmlFor="course-video-input" className="file-input-label">
                          <span className="file-input-text">
                            {courseForm.previewVideoFile ? courseForm.previewVideoFile.name : "Choose video (max 1MB)"}
                          </span>
                        </label>
                      </div>
                      {courseForm.previewVideoFile && (
                        <p className="file-name">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          {courseForm.previewVideoFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Learning Outcomes Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-lightbulb"></i>
                    What Students Will Learn
                  </div>
                  <div className="form-group full-width">
                    <div className="learn-points-wrapper">
                      <ul className="learn-points-list">
                        {courseForm.learnPoints.length > 0 ? (
                          courseForm.learnPoints.map((point, index) => (
                            <li key={index} className="learn-point-item">
                              <span>
                                <i className="bi bi-check2-circle me-2" style={{ color: '#10b981' }}></i>
                                {point}
                              </span>
                              <button
                                className="btn-remove-point"
                                onClick={() => removeLearnPoint(index)}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </li>
                          ))
                        ) : (
                          <li className="empty-state">
                            <i className="bi bi-inbox" style={{ fontSize: '2rem', color: '#d1d5db', marginBottom: '0.5rem' }}></i>
                            <span className="empty-state-text">No learning points added yet</span>
                          </li>
                        )}
                      </ul>
                      <div className="add-point-container">
                        <input
                          type="text"
                          placeholder="Add a learning outcome (e.g., Master basic sign language)"
                          value={newLearnPoint}
                          onChange={handleNewLearnPointChange}
                          maxLength={100}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addLearnPoint();
                            }
                          }}
                        />
                        <button className="btn-add-point" onClick={addLearnPoint}>
                          <i className="bi bi-plus-circle me-1"></i>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  if (courseForm.thumbnailPreview) URL.revokeObjectURL(courseForm.thumbnailPreview);
                  setShowCourseForm(false);
                  setEditCourse(null);
                  setCourseForm(initialCourseForm);
                  setNewLearnPoint("");
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleAddCourse}
                disabled={isSubmittingCourse}
              >
                <i className="bi bi-check-circle me-1"></i>
                {editCourse ? "Update Course" : "Save Course"}
              </button>
            </div>
          </div>
        </div>
      )}


      {filteredCourses.length === 0 ? (
        renderNoResults("courses")
      ) : (
        <div className="lms-table-container">
          <table className="lms-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Discount</th>
                <th>Price</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((c, i) => (
                <tr key={c.id || i}>
                  <td data-label="#">{i + 1}</td>
                  <td data-label="Title">{c.title}</td>
                  <td data-label="Author">{c.author}</td>
                  <td data-label="Category">{c.category}</td>
                  <td data-label="Discount">{calculateDiscount(c.price, c.actualPrice)}%</td>
                  <td data-label="Price">
                    ₹{c.price} / <span className="strike">₹{c.actualPrice}</span>
                  </td>
                  <td data-label="Created Date">{c.date}</td>
                  <td data-label="Actions">
                    <button className="btn-edit" onClick={() => handleEditCourse(c)}>
                      Edit
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => prepareRemoveCourse(c)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  const renderLessons = () => (
    <>
      <div className="lms-controls">
        <div className="lms-header">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchLesson}
            onChange={(e) => setSearchLesson(e.target.value)}
            className="search-input"
          />
          <Select
            className="filter-select"
            options={courseFilterOptions}
            value={selectedCourseFilter}
            onChange={setSelectedCourseFilter}
            placeholder="All Courses"
            isClearable
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <button
            className="btn-add"
            onClick={() => {
              setEditLesson(null);
              setLessonForm(initialLessonForm);
              setShowLessonForm(true);
            }}
          >
            + Add Lesson
          </button>
        </div>
      </div>

      {showLessonForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className="bi bi-play-btn"></i>
                {editLesson ? "Edit Lesson" : "Add New Lesson"}
              </h3>
              <button className="modal-close" onClick={() => {
                setShowLessonForm(false);
                setEditLesson(null);
                setLessonForm(initialLessonForm);
              }}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <div className="form-section-title">
                  <i className="bi bi-info-circle"></i>
                  Lesson Details
                </div>

                <div className="form-group">
                  <label>
                    <i className="bi bi-card-text"></i>
                    Lesson Title <span className="mandatory">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      name="title"
                      placeholder="e.g., Introduction to Sign Language Basics"
                      value={lessonForm.title}
                      onChange={handleLessonOtherChange}
                      maxLength={100}
                      pattern="[A-Za-z0-9 \-]+"
                      title="Only letters, numbers, spaces, and hyphens allowed"
                    />
                    <span className="char-count">{lessonForm.title.length}/100</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="bi bi-folder"></i>
                      Category <span className="mandatory">*</span>
                    </label>
                    <Select
                      className="filter-select"
                      options={categoryNameOptions}
                      value={categoryNameOptions.find((option) => option.value === lessonForm.category) || null}
                      onChange={(selectedOption) => handleLessonChange("category", selectedOption)}
                      placeholder="Select Category"
                      isClearable
                      styles={selectStyles}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <i className="bi bi-journal"></i>
                      Course <span className="mandatory">*</span>
                    </label>
                    <Select
                      className="filter-select"
                      options={courseOptions}
                      value={courseOptions.find((option) => option.value === lessonForm.course) || null}
                      onChange={(selectedOption) => handleLessonChange("course", selectedOption)}
                      placeholder="Select Course"
                      isClearable
                      styles={selectStyles}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <i className="bi bi-play-circle"></i>
                    Video URL <span className="mandatory">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      name="videoUrl"
                      type="url"
                      placeholder="https://example.com/video.mp4"
                      value={lessonForm.videoUrl}
                      onChange={handleLessonOtherChange}
                      maxLength={200}
                      title="Enter a valid video URL"
                    />
                    <span className="char-count">{lessonForm.videoUrl.length}/200</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowLessonForm(false);
                  setEditLesson(null);
                  setLessonForm(initialLessonForm);
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleAddLesson}
                disabled={isSubmittingLesson}
              >
                <i className="bi bi-check-circle me-1"></i>
                {editLesson ? "Update Lesson" : "Save Lesson"}
              </button>
            </div>
          </div>
        </div>
      )}


      {filteredLessons.length === 0 ? (
        renderNoResults("lessons")
      ) : (
        <div className="lms-table-container">
          <table className="lms-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Lesson Title</th>
                <th>Video URL</th>
                <th>Category</th>
                <th>Course</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((l, i) => (
                <tr key={l.id || i}>
                  <td data-label="#">{i + 1}</td>
                  <td data-label="Lesson Title">{l.title}</td>
                  <td data-label="Video URL">{l.videoUrl}</td>
                  <td data-label="Category">{l.category}</td>
                  <td data-label="Course">{l.course}</td>
                  <td data-label="Date">{l.date}</td>
                  <td data-label="Actions">
                    <button className="btn-edit" onClick={() => handleEditLesson(l)}>
                      Edit
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => prepareRemoveLesson(l)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="lms-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-book me-2"></i>
              LMS Management
            </h2>
            <div className="breadcrumbs">{getBreadcrumbs()}</div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{loadingCategories ? "..." : categories.length}</span>
              <span className="stat-labelR">Categories</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{courses.length}</span>
              <span className="stat-labelR">Courses</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{lessons.length}</span>
              <span className="stat-labelR">Lessons</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lms-tabs">
        <button
          className={activeTab === "categories" ? "active" : ""}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
        <button
          className={activeTab === "courses" ? "active" : ""}
          onClick={() => setActiveTab("courses")}
        >
          Courses
        </button>
        <button
          className={activeTab === "lessons" ? "active" : ""}
          onClick={() => setActiveTab("lessons")}
        >
          Lessons
        </button>
      </div>

      {activeTab === "categories" && renderCategories()}
      {activeTab === "courses" && renderCourses()}
      {activeTab === "lessons" && renderLessons()}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-notification ${toast.type}`}
          >
            <div className="toast-content">
              <span className="toast-icon"></span>
              <div className="toast-body">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-description">{toast.description}</div>
              </div>
              <button
                className="toast-close"
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>X</button>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this {deleteType}? {deleteType === "category" ? "This will also delete related courses and lessons." : deleteType === "course" ? "This will also delete related lessons." : ""}</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn-remove" onClick={confirmRemove}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsManagement;