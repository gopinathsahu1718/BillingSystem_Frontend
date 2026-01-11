import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import "./StoreManagement.css";
import { useAuth } from "../../context/AuthContext";

const StoreManagement = () => {
  const BASE_URL = 'http://13.232.200.172/api/store';
  const STATIC_BASE = 'http://13.232.200.172';
  const { token } = useAuth();
const PREDEFINED_CATEGORIES = [
  { label: "Laxmi Bookstore", value: "laxmi_bookstore", displayName: "Laxmi Bookstore" },
  { label: "Swasthik Enterprises", value: "swasthik_enterprises", displayName: "Swasthik Enterprises" }
];
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [editSubcategory, setEditSubcategory] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchSubcategory, setSearchSubcategory] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Loading states for form submissions
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [isSubmittingSubcategory, setIsSubmittingSubcategory] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Invalid field markers for UI validation
  const [categoryInvalid, setCategoryInvalid] = useState({});
  const [subcategoryInvalid, setSubcategoryInvalid] = useState({});
  const [productInvalid, setProductInvalid] = useState({});
  // Attribute management states
  const [productAttributes, setProductAttributes] = useState([]);
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [attributeForm, setAttributeForm] = useState({
    attributeName: "",
    attributeValue: "",
    price: "",
    actualPrice: "",
    stock: "",
    sku: "",
  });
  const [editingAttributeIndex, setEditingAttributeIndex] = useState(null);

  // Form states
  const initialCategoryForm = { 
  name: "", 
  description: "", 
  thumbnailFile: null, 
  thumbnailPreview: null,
  selectedPredefinedCategory: null 
};
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);

  const initialSubcategoryForm = {
    name: "",
    description: "",
    categoryId: null,
    thumbnailFile: null,
    thumbnailPreview: null,
  };
  const [subcategoryForm, setSubcategoryForm] = useState(initialSubcategoryForm);

  const initialProductForm = {
    name: "",
    description: "",
    categoryId: null,
    subCategoryId: null,
    sku: "",
    hsn: "",
    gstRate: "",
    price: "",
    actualPrice: "",
    stock: "",
    unit: "piece",
    thumbnailFile: null,
    thumbnailPreview: null,
  };
  const [productForm, setProductForm] = useState(initialProductForm);
  // Check if all predefined categories exist
const canAddCategory = () => {
  const existingCategoryNames = categories.map(cat => cat.name.toLowerCase());
  const allPredefinedExist = PREDEFINED_CATEGORIES.every(
    predef => existingCategoryNames.includes(predef.value.toLowerCase())
  );
  return !allPredefinedExist;
};

// Get available predefined categories
const getAvailablePredefinedCategories = () => {
  const existingCategoryNames = categories.map(cat => cat.name.toLowerCase());
  return PREDEFINED_CATEGORIES.filter(
    predef => !existingCategoryNames.includes(predef.value.toLowerCase())
  );
};

// Get stock display text
const getStockDisplay = (product) => {
  if (product.attributes && product.attributes.length > 0) {
    return "Varies by variant";
  }
  return product.stock || 0;
};

// Handle predefined category selection
const handlePredefinedCategoryChange = (selectedOption) => {
  setCategoryForm({ 
    ...categoryForm, 
    selectedPredefinedCategory: selectedOption,
    name: selectedOption ? selectedOption.value : ""
  });
  // clear invalid marker for predefined/category name
  setCategoryInvalid((prev) => ({ ...prev, selectedPredefinedCategory: false, name: false }));
};

  const fetchSubcategoriesAndProducts = useCallback(async (currentCategories) => {
    if (!token || !token.trim()) {
      setSubcategories([]);
      setProducts([]);
      return;
    }

    let fetchedSubcategories = [];
    let fetchedProducts = [];

    try {
      // Fetch Subcategories
      const subcategoryResponse = await axios.get(`${BASE_URL}/subcategories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (subcategoryResponse.data && subcategoryResponse.data.success && Array.isArray(subcategoryResponse.data.data)) {
        fetchedSubcategories = subcategoryResponse.data.data.map((subcat) => ({
          id: subcat.id,
          name: subcat.name,
          description: subcat.description || "",
          categoryId: subcat.categoryId,
          categoryName: subcat.category?.name || 'Uncategorized',
          thumbnail: subcat.thumbnailImageUrl || null,
          date: new Date(subcat.createdAt).toLocaleDateString(),
        }));
      }

      // Fetch Products
      const productResponse = await axios.get(`${BASE_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (productResponse.data && productResponse.data.success && Array.isArray(productResponse.data.data)) {
        fetchedProducts = productResponse.data.data.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description || "",
          categoryId: product.categoryId,
          categoryName: product.category?.name || 'Uncategorized',
          subCategoryId: product.subCategoryId,
          subCategoryName: product.subcategory?.name || 'Uncategorized',
          sku: product.sku,
          hsn: product.hsn || "",
          gstRate: product.gstRate ? product.gstRate.toString() : "",
          price: product.price ? product.price.toString() : "",
          actualPrice: product.actualPrice ? product.actualPrice.toString() : "",
          stock: product.stock || 0,
          unit: product.unit || "piece",
          thumbnail: product.thumbnailImageUrl || null,
          attributes: product.attributes || [],
          date: new Date(product.createdAt).toLocaleDateString(),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch subcategories/products:", error);
      if (error.response?.status === 401) {
        showToast("error", "Unauthorized", "Session expired. Please log in again.");
      } else {
        showToast("error", "Error", "Failed to load data.");
      }
      fetchedSubcategories = [];
      fetchedProducts = [];
    }

    setSubcategories(fetchedSubcategories);
    setProducts(fetchedProducts);
  }, [token]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (categoryForm.thumbnailPreview) URL.revokeObjectURL(categoryForm.thumbnailPreview);
      if (subcategoryForm.thumbnailPreview) URL.revokeObjectURL(subcategoryForm.thumbnailPreview);
      if (productForm.thumbnailPreview) URL.revokeObjectURL(productForm.thumbnailPreview);
    };
  }, [categoryForm.thumbnailPreview, subcategoryForm.thumbnailPreview, productForm.thumbnailPreview]);

  // Fetch categories, subcategories, and products on component mount
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
          const catResponse = await axios.get(`${BASE_URL}/categories`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (catResponse.data && catResponse.data.success && Array.isArray(catResponse.data.data)) {
            fetchedCategories = catResponse.data.data.map((cat) => ({
              id: cat.id,
              name: cat.name,
              description: cat.description || "",
              thumbnail: cat.thumbnailImageUrl || null,
              date: new Date(cat.createdAt).toLocaleDateString(),
            }));
          }
        } catch (catError) {
          console.error("Failed to fetch categories:", catError);
          if (catError.response?.status === 401) {
            showToast("error", "Unauthorized", "Session expired. Please log in again.");
          } else {
            showToast("error", "Error", "Failed to load categories.");
          }
          fetchedCategories = [];
        }

        setCategories(fetchedCategories);
        await fetchSubcategoriesAndProducts(fetchedCategories);
      } catch (error) {
        console.error("Critical fetch error:", error);
        showToast("error", "Error", "Network error. Please check your connection and try again.");
        setCategories([]);
        setSubcategories([]);
        setProducts([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [token, fetchSubcategoriesAndProducts]);

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
      if (files[0].size > 5 * 1024 * 1024) {
        showToast("error", "Error", "Thumbnail image size exceeds 5MB limit.");
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
      setCategoryForm({ ...categoryForm, [name]: value });
      // clear invalid marker when user types
      setCategoryInvalid((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubcategoryChange = (selectedOption) => {
    setSubcategoryForm({ ...subcategoryForm, categoryId: selectedOption ? selectedOption.value : null });
    setSubcategoryInvalid((prev) => ({ ...prev, categoryId: false }));
  };

  const handleSubcategoryOtherChange = (e) => {
    const { name, files, value } = e.target;
    if (name === "thumbnail" && files && files[0]) {
      if (files[0].size > 5 * 1024 * 1024) {
        showToast("error", "Error", "Thumbnail image size exceeds 5MB limit.");
        return;
      }
      if (!files[0].type.startsWith("image/")) {
        showToast("error", "Error", "Please upload a valid image file.");
        return;
      }
      const file = files[0];
      if (subcategoryForm.thumbnailPreview) {
        URL.revokeObjectURL(subcategoryForm.thumbnailPreview);
      }
      const preview = URL.createObjectURL(file);
      setSubcategoryForm({ ...subcategoryForm, thumbnailFile: file, thumbnailPreview: preview });
    } else {
      setSubcategoryForm({ ...subcategoryForm, [name]: value });
      setSubcategoryInvalid((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleProductCategoryChange = (selectedOption) => {
    setProductForm({ ...productForm, categoryId: selectedOption ? selectedOption.value : null, subCategoryId: null });
    setProductInvalid((prev) => ({ ...prev, categoryId: false, subCategoryId: false }));
  };

  const handleProductSubcategoryChange = (selectedOption) => {
    setProductForm({ ...productForm, subCategoryId: selectedOption ? selectedOption.value : null });
    setProductInvalid((prev) => ({ ...prev, subCategoryId: false }));
  };

  const handleProductOtherChange = (e) => {
    const { name, files, value } = e.target;
    if (name === "thumbnail" && files && files[0]) {
      if (files[0].size > 5 * 1024 * 1024) {
        showToast("error", "Error", "Thumbnail image size exceeds 5MB limit.");
        return;
      }
      if (!files[0].type.startsWith("image/")) {
        showToast("error", "Error", "Please upload a valid image file.");
        return;
      }
      const file = files[0];
      if (productForm.thumbnailPreview) {
        URL.revokeObjectURL(productForm.thumbnailPreview);
      }
      const preview = URL.createObjectURL(file);
      setProductForm({ ...productForm, thumbnailFile: file, thumbnailPreview: preview });
    } else if (name === "price" || name === "actualPrice" || name === "stock" || name === "gstRate") {
      if (/^\d*\.?\d*$/.test(value)) {
        setProductForm({ ...productForm, [name]: value });
        setProductInvalid((prev) => ({ ...prev, [name]: false }));
      }
    } else {
      setProductForm({ ...productForm, [name]: value });
      setProductInvalid((prev) => ({ ...prev, [name]: false }));
    }
  };

  // Attribute Management Functions
  const handleAttributeChange = (e) => {
    const { name, value } = e.target;
    if (name === "price" || name === "actualPrice" || name === "stock") {
      if (/^\d*\.?\d*$/.test(value)) {
        setAttributeForm({ ...attributeForm, [name]: value });
      }
    } else {
      setAttributeForm({ ...attributeForm, [name]: value });
    }
  };

  const handleAddAttribute = () => {
    if (!attributeForm.attributeName.trim() || !attributeForm.attributeValue.trim() || !attributeForm.price || !attributeForm.sku.trim()) {
      showToast("error", "Error", "Attribute name, value, price, and SKU are required.");
      return;
    }

    // Check for duplicate SKU in attributes (excluding the one being edited)
    const isDuplicateSku = productAttributes.some(
      (attr, index) => 
        attr.sku.toLowerCase() === attributeForm.sku.toLowerCase() && 
        index !== editingAttributeIndex
    );

    if (isDuplicateSku) {
      showToast("error", "Error", "Duplicate SKU in attributes.");
      return;
    }

    const newAttribute = {
      attributeName: attributeForm.attributeName.trim(),
      attributeValue: attributeForm.attributeValue.trim(),
      price: parseFloat(attributeForm.price),
      actualPrice: attributeForm.actualPrice ? parseFloat(attributeForm.actualPrice) : null,
      stock: attributeForm.stock ? parseInt(attributeForm.stock) : 0,
      sku: attributeForm.sku.trim(),
    };

    if (editingAttributeIndex !== null) {
      // Update existing attribute - preserve ID if it exists
      const updatedAttributes = [...productAttributes];
      const existingAttr = updatedAttributes[editingAttributeIndex];
      
      // Keep the database ID if this is an existing attribute
      if (existingAttr.id) {
        newAttribute.id = existingAttr.id;
      }
      
      updatedAttributes[editingAttributeIndex] = newAttribute;
      setProductAttributes(updatedAttributes);
      showToast("success", "Success", "Attribute updated.");
      setEditingAttributeIndex(null);
    } else {
      // Add new attribute
      setProductAttributes([...productAttributes, newAttribute]);
      showToast("success", "Success", "Attribute added.");
    }

    // Reset form
    setAttributeForm({
      attributeName: "",
      attributeValue: "",
      price: "",
      actualPrice: "",
      stock: "",
      sku: "",
    });
    setShowAttributeForm(false);
  };

  const handleEditAttribute = (index) => {
    const attr = productAttributes[index];
    setAttributeForm({
      attributeName: attr.attributeName,
      attributeValue: attr.attributeValue,
      price: attr.price.toString(),
      actualPrice: attr.actualPrice ? attr.actualPrice.toString() : "",
      stock: attr.stock ? attr.stock.toString() : "",
      sku: attr.sku,
    });
    setEditingAttributeIndex(index);
    setShowAttributeForm(true);
    
    if (attr.id) {
      console.log('Editing database attribute:', attr.id);
    } else {
      console.log('Editing new local attribute');
    }
  };

  const handleDeleteAttribute = (index) => {
    const attrToDelete = productAttributes[index];
    
    // If attribute has an ID, it's from database - mark for deletion
    // If no ID, it's a new local attribute - just remove from array
    if (attrToDelete.id) {
      console.log('Marking database attribute for deletion:', attrToDelete.id);
    } else {
      console.log('Removing local attribute:', attrToDelete.attributeValue);
    }
    
    const updatedAttributes = productAttributes.filter((_, i) => i !== index);
    setProductAttributes(updatedAttributes);
    showToast("success", "Success", "Attribute removed.");
  };

  const calculateAttributeDiscount = (price, actualPrice) => {
    const p = parseFloat(price);
    const a = parseFloat(actualPrice);
    if (!p || !a || p >= a || isNaN(p) || isNaN(a)) return 0;
    return Math.round(((a - p) / a) * 100);
  };

  const isDuplicateCategory = (name, editItem) => {
    return categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== (editItem?.id || null));
  };

  const isDuplicateSubcategory = (name, categoryId, editItem) => {
    return subcategories.some(
      (subcat) =>
        subcat.name.toLowerCase() === name.toLowerCase() &&
        subcat.categoryId === categoryId &&
        subcat.id !== (editItem?.id || null)
    );
  };

  const isDuplicateProduct = (sku, editItem) => {
    return products.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== (editItem?.id || null));
  };

  const handleAddCategory = async () => {
    if (!token || !token.trim()) {
      showToast("error", "Unauthorized", "Please log in to add a category.");
      return;
    }
    if (!categoryForm.name.trim() && !categoryForm.selectedPredefinedCategory) {
      setCategoryInvalid({ name: true, selectedPredefinedCategory: true });
      showToast("error", "Error", "Category selection is required.");
      return;
    }

    const categoryName = categoryForm.selectedPredefinedCategory 
      ? categoryForm.selectedPredefinedCategory.value 
      : categoryForm.name.trim();
    if (isDuplicateCategory(categoryForm.name, editCategory)) {
      showToast("error", "Error", "Duplicate category name.");
      return;
    }

    setIsSubmittingCategory(true);
    try {
      const formData = new FormData();
      formData.append('name', categoryName);
      if (categoryForm.description) {
        formData.append('description', categoryForm.description.trim());
      }
      if (categoryForm.thumbnailFile) {
        formData.append('thumbnail', categoryForm.thumbnailFile);
      }

      let apiResponse;
      if (editCategory) {
        apiResponse = await axios.put(
          `${BASE_URL}/categories/${editCategory.id}`,
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
          `${BASE_URL}/categories`,
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
          id: updatedCategory.id || editCategory?.id,
          name: updatedCategory.name,
          description: updatedCategory.description || "",
          thumbnail: updatedCategory.thumbnailImageUrl || categoryForm.thumbnailPreview || null,
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
      if (error.response?.status === 401) {
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
    setEditCategory(category);
const matchingPredefined = PREDEFINED_CATEGORIES.find(
  predef => predef.value.toLowerCase() === category.name.toLowerCase()
);
    let originalFilename = "Current thumbnail";
    if (category.thumbnail) {
      const urlParts = category.thumbnail.split('/');
      originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
    }
    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      thumbnailFile: category.thumbnail ? { name: originalFilename } : null,
      thumbnailPreview: category.thumbnail || null,
      selectedPredefinedCategory: matchingPredefined || null
    });
  };

  const prepareRemoveCategory = (category) => {
    setItemToDelete(category);
    setDeleteType("category");
    setShowDeleteModal(true);
  };

  const handleAddSubcategory = async () => {
    if (!token || !token.trim()) {
      showToast("error", "Unauthorized", "Please log in to add a subcategory.");
      return;
    }
    if (!subcategoryForm.name.trim() || !subcategoryForm.categoryId) {
      setSubcategoryInvalid({ name: !subcategoryForm.name.trim(), categoryId: !subcategoryForm.categoryId });
      showToast("error", "Error", "Subcategory name and category are required.");
      return;
    }
    if (isDuplicateSubcategory(subcategoryForm.name, subcategoryForm.categoryId, editSubcategory)) {
      showToast("error", "Error", "Duplicate subcategory name in this category.");
      return;
    }

    setIsSubmittingSubcategory(true);
    try {
      const formData = new FormData();
      formData.append('name', subcategoryForm.name.trim());
      formData.append('categoryId', subcategoryForm.categoryId);
      if (subcategoryForm.description) {
        formData.append('description', subcategoryForm.description.trim());
      }
      if (subcategoryForm.thumbnailFile) {
        formData.append('thumbnail', subcategoryForm.thumbnailFile);
      }

      let apiResponse;
      if (editSubcategory) {
        apiResponse = await axios.put(
          `${BASE_URL}/subcategories/${editSubcategory.id}`,
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
          `${BASE_URL}/subcategories`,
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
        const updatedSubcategory = apiResponse.data.data;
        const categoryName = categories.find(cat => cat.id === subcategoryForm.categoryId)?.name || 'Uncategorized';
        
        const newSubcategory = {
          id: updatedSubcategory.id || editSubcategory?.id,
          name: updatedSubcategory.name,
          description: updatedSubcategory.description || "",
          categoryId: updatedSubcategory.categoryId,
          categoryName: categoryName,
          thumbnail: updatedSubcategory.thumbnailImageUrl || subcategoryForm.thumbnailPreview || null,
          date: new Date(updatedSubcategory.updatedAt || updatedSubcategory.createdAt).toLocaleDateString(),
        };

        if (editSubcategory) {
          setSubcategories(subcategories.map((subcat) => (subcat.id === editSubcategory.id ? newSubcategory : subcat)));
          showToast("success", "Success", "Subcategory updated successfully.");
        } else {
          setSubcategories([...subcategories, newSubcategory]);
          showToast("success", "Success", "Subcategory added successfully.");
        }
      } else {
        throw new Error("Unexpected API response");
      }

      setEditSubcategory(null);
      setSubcategoryForm(initialSubcategoryForm);
      setShowSubcategoryForm(false);
    } catch (error) {
      console.error("Failed to save subcategory:", error);
      let errorMsg = `Failed to ${editSubcategory ? 'update' : 'add'} subcategory. Please try again.`;
      if (error.response?.status === 401) {
        errorMsg = "Unauthorized. Please log in again.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      showToast("error", "Error", errorMsg);
    } finally {
      setIsSubmittingSubcategory(false);
    }
  };

  const handleEditSubcategory = (subcategory) => {
    setShowSubcategoryForm(true);
    setEditSubcategory(subcategory);

    let originalFilename = "Current thumbnail";
    if (subcategory.thumbnail) {
      const urlParts = subcategory.thumbnail.split('/');
      originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
    }
    setSubcategoryForm({
      name: subcategory.name || "",
      description: subcategory.description || "",
      categoryId: subcategory.categoryId,
      thumbnailFile: subcategory.thumbnail ? { name: originalFilename } : null,
      thumbnailPreview: subcategory.thumbnail || null
    });
  };

  const prepareRemoveSubcategory = (subcategory) => {
    setItemToDelete(subcategory);
    setDeleteType("subcategory");
    setShowDeleteModal(true);
  };

  const calculateDiscount = (price, actualPrice) => {
    const p = parseFloat(price);
    const a = parseFloat(actualPrice);
    if (!p || !a || p >= a || isNaN(p) || isNaN(a)) return 0;
    return Math.round(((a - p) / a) * 100);
  };

  const handleAddProduct = async () => {
    if (!token || !token.trim()) {
      showToast("error", "Unauthorized", "Please log in to add a product.");
      return;
    }
    if (!productForm.name.trim() || !productForm.categoryId || !productForm.subCategoryId || !productForm.sku.trim() || !productForm.price) {
      setProductInvalid({
        name: !productForm.name.trim(),
        categoryId: !productForm.categoryId,
        subCategoryId: !productForm.subCategoryId,
        sku: !productForm.sku.trim(),
        price: !productForm.price
      });
      showToast("error", "Error", "All mandatory fields are required.");
      return;
    }
    if (isDuplicateProduct(productForm.sku, editProduct)) {
      showToast("error", "Error", "Duplicate SKU.");
      return;
    }

    const priceVal = parseFloat(productForm.price);
    const actualVal = parseFloat(productForm.actualPrice);
    if (productForm.actualPrice && (isNaN(actualVal) || priceVal >= actualVal)) {
      showToast("error", "Error", "Price must be less than Actual Price.");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const formData = new FormData();
      formData.append('name', productForm.name.trim());
      formData.append('categoryId', productForm.categoryId);
      formData.append('subCategoryId', productForm.subCategoryId);
      formData.append('sku', productForm.sku.trim());
      formData.append('price', parseFloat(productForm.price));
      
      if (productForm.description) formData.append('description', productForm.description.trim());
      if (productForm.hsn) formData.append('hsn', productForm.hsn.trim());
      if (productForm.gstRate) formData.append('gstRate', parseFloat(productForm.gstRate));
      if (productForm.actualPrice) formData.append('actualPrice', parseFloat(productForm.actualPrice));
      if (productForm.stock) formData.append('stock', parseInt(productForm.stock));
      if (productForm.unit) formData.append('unit', productForm.unit);
      if (productForm.thumbnailFile) formData.append('thumbnail', productForm.thumbnailFile);

      let apiResponse;
      if (editProduct) {
        apiResponse = await axios.put(
          `${BASE_URL}/products/${editProduct.id}`,
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
          `${BASE_URL}/products`,
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
        const updatedProduct = apiResponse.data.data;
        const productId = updatedProduct.id || editProduct?.id;

        // Handle attributes for both new and existing products
        let attributesSaved = 0;
        let attributesFailed = 0;
        let attributesUpdated = 0;
        let attributesDeleted = 0;
        
        if (productAttributes.length > 0 || editProduct) {
          console.log('Managing attributes for product:', productId);
          console.log('Current attributes in form:', productAttributes.length);
          
          // If editing, first fetch existing attributes to compare
          let existingAttributes = [];
          if (editProduct) {
            try {
              const existingAttrResponse = await axios.get(
                `http://13.232.200.172/api/products/${productId}/attributes`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (existingAttrResponse.data && existingAttrResponse.data.success) {
                existingAttributes = existingAttrResponse.data.data || [];
                console.log('Existing attributes in DB:', existingAttributes.length);
              }
            } catch (error) {
              console.log('No existing attributes or error fetching them');
            }
          }

          // Process current attributes
          for (const attr of productAttributes) {
            try {
              // Check if this attribute already exists (has an ID from DB)
              const existingAttr = existingAttributes.find(
                existing => existing.id === attr.id
              );

              if (existingAttr) {
                // UPDATE existing attribute
                console.log('Updating attribute:', attr.id);
                const updateResponse = await axios.put(
                  `http://13.232.200.172/api/attributes/${attr.id}`,
                  {
                    attributeName: attr.attributeName,
                    attributeValue: attr.attributeValue,
                    price: parseFloat(attr.price),
                    actualPrice: attr.actualPrice ? parseFloat(attr.actualPrice) : null,
                    stock: attr.stock ? parseInt(attr.stock) : 0,
                    sku: attr.sku,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                console.log('Attribute updated successfully:', updateResponse.data);
                attributesUpdated++;
              } else {
                // CREATE new attribute
                console.log('Creating new attribute:', attr);
                const createResponse = await axios.post(
                  `http://13.232.200.172/api/products/${productId}/attributes`,
                  {
                    attributeName: attr.attributeName,
                    attributeValue: attr.attributeValue,
                    price: parseFloat(attr.price),
                    actualPrice: attr.actualPrice ? parseFloat(attr.actualPrice) : null,
                    stock: attr.stock ? parseInt(attr.stock) : 0,
                    sku: attr.sku,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                console.log('Attribute created successfully:', createResponse.data);
                attributesSaved++;
              }
            } catch (attrError) {
              console.error("Failed to save/update attribute:", attrError);
              console.error("Error response:", attrError.response?.data);
              console.error("Error status:", attrError.response?.status);
              attributesFailed++;
            }
          }

          // Delete attributes that were removed (exist in DB but not in form)
          if (editProduct && existingAttributes.length > 0) {
            const currentAttrIds = productAttributes
              .filter(attr => attr.id)
              .map(attr => attr.id);
            
            for (const existingAttr of existingAttributes) {
              if (!currentAttrIds.includes(existingAttr.id)) {
                try {
                  console.log('Deleting removed attribute:', existingAttr.id);
                  await axios.delete(
                    `http://13.232.200.172/api/attributes/${existingAttr.id}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  console.log('Attribute deleted successfully');
                  attributesDeleted++;
                } catch (delError) {
                  console.error('Failed to delete attribute:', delError);
                }
              }
            }
          }
        }

        const categoryName = categories.find(cat => cat.id === productForm.categoryId)?.name || 'Uncategorized';
        const subCategoryName = subcategories.find(subcat => subcat.id === productForm.subCategoryId)?.name || 'Uncategorized';
        
        const newProduct = {
          id: productId,
          name: updatedProduct.name,
          description: updatedProduct.description || "",
          categoryId: updatedProduct.categoryId,
          categoryName: categoryName,
          subCategoryId: updatedProduct.subCategoryId,
          subCategoryName: subCategoryName,
          sku: updatedProduct.sku,
          hsn: updatedProduct.hsn || "",
          gstRate: updatedProduct.gstRate ? updatedProduct.gstRate.toString() : "",
          price: updatedProduct.price ? updatedProduct.price.toString() : "",
          actualPrice: updatedProduct.actualPrice ? updatedProduct.actualPrice.toString() : "",
          stock: updatedProduct.stock || 0,
          unit: updatedProduct.unit || "piece",
          thumbnail: updatedProduct.thumbnailImageUrl || productForm.thumbnailPreview || null,
          attributes: productAttributes,
          date: new Date(updatedProduct.updatedAt || updatedProduct.createdAt).toLocaleDateString(),
        };

        if (editProduct) {
          setProducts(products.map((p) => (p.id === editProduct.id ? newProduct : p)));
          
          // Build success message for edit
          let message = "Product updated successfully.";
          const changes = [];
          if (attributesSaved > 0) changes.push(`${attributesSaved} variant(s) added`);
          if (attributesUpdated > 0) changes.push(`${attributesUpdated} variant(s) updated`);
          if (attributesDeleted > 0) changes.push(`${attributesDeleted} variant(s) deleted`);
          if (attributesFailed > 0) changes.push(`${attributesFailed} failed`);
          
          if (changes.length > 0) {
            message += " " + changes.join(", ") + ".";
          }
          
          showToast(attributesFailed > 0 ? "warning" : "success", attributesFailed > 0 ? "Partial Success" : "Success", message);
        } else {
          setProducts([...products, newProduct]);
          if (productAttributes.length > 0) {
            if (attributesFailed === 0) {
              showToast("success", "Success", `Product and ${attributesSaved} variant(s) added successfully.`);
            } else if (attributesSaved > 0) {
              showToast("warning", "Partial Success", `Product added. ${attributesSaved} variant(s) saved, ${attributesFailed} failed.`);
            } else {
              showToast("warning", "Warning", `Product added but all ${attributesFailed} variant(s) failed to save. Check console for details.`);
            }
          } else {
            showToast("success", "Success", "Product added successfully.");
          }
        }
      } else {
        throw new Error("Unexpected API response");
      }

      setEditProduct(null);
      setProductForm(initialProductForm);
      setProductAttributes([]);
      setShowProductForm(false);
    } catch (error) {
      console.error("Failed to save product:", error);
      let errorMsg = `Failed to ${editProduct ? 'update' : 'add'} product. Please try again.`;
      if (error.response?.status === 401) {
        errorMsg = "Unauthorized. Please log in again.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      showToast("error", "Error", errorMsg);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleEditProduct = async (product) => {
    setShowProductForm(true);
    setEditProduct(product);

    let originalFilename = "Current thumbnail";
    if (product.thumbnail) {
      const urlParts = product.thumbnail.split('/');
      originalFilename = urlParts[urlParts.length - 1] || "Current thumbnail";
    }
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId,
      sku: product.sku || "",
      hsn: product.hsn || "",
      gstRate: product.gstRate || "",
      price: product.price || "",
      actualPrice: product.actualPrice || "",
      stock: product.stock ? product.stock.toString() : "",
      unit: product.unit || "piece",
      thumbnailFile: product.thumbnail ? { name: originalFilename } : null,
      thumbnailPreview: product.thumbnail || null
    });

    // Fetch and set existing attributes
    if (product.id) {
      try {
        const attrResponse = await axios.get(`http://13.232.200.172/api/products/${product.id}/attributes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (attrResponse.data && attrResponse.data.success) {
          setProductAttributes(attrResponse.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch product attributes:", error);
        setProductAttributes([]);
      }
    }
  };

  const prepareRemoveProduct = (product) => {
    setItemToDelete(product);
    setDeleteType("product");
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
          `${BASE_URL}/categories/${itemToDelete.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (apiResponse.data && apiResponse.data.success) {
          const categoryId = itemToDelete.id;
          setCategories(categories.filter((cat) => cat.id !== categoryId));
          setSubcategories(subcategories.filter((subcat) => subcat.categoryId !== categoryId));
          setProducts(products.filter((product) => product.categoryId !== categoryId));
          showToast("success", "Success", "Category and related items deleted successfully.");
        } else {
          throw new Error("Unexpected API response");
        }
      } else if (deleteType === "subcategory") {
        const apiResponse = await axios.delete(
          `${BASE_URL}/subcategories/${itemToDelete.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (apiResponse.data && apiResponse.data.success) {
          const subcategoryId = itemToDelete.id;
          setSubcategories(subcategories.filter((subcat) => subcat.id !== subcategoryId));
          setProducts(products.filter((product) => product.subCategoryId !== subcategoryId));
          showToast("success", "Success", "Subcategory and related products deleted successfully.");
        } else {
          throw new Error("Unexpected API response");
        }
      } else if (deleteType === "product") {
        const apiResponse = await axios.delete(
          `${BASE_URL}/products/${itemToDelete.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (apiResponse.data && apiResponse.data.success) {
          setProducts(products.filter((p) => p.id !== itemToDelete.id));
          showToast("success", "Success", "Product deleted successfully.");
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

  const filteredCategories = categories.filter((cat) =>
    cat && cat.name && cat.name.toLowerCase().includes(searchCategory.toLowerCase())
  );

  const filteredSubcategories = subcategories.filter(
    (subcat) =>
      subcat && subcat.name && subcat.name.toLowerCase().includes(searchSubcategory.toLowerCase()) &&
      (!selectedCategoryFilter || subcat.categoryId === selectedCategoryFilter.value)
  );

  const filteredProducts = products.filter(
    (p) =>
      p && p.name && p.name.toLowerCase().includes(searchProduct.toLowerCase()) &&
      (!selectedSubcategoryFilter || p.subCategoryId === selectedSubcategoryFilter.value)
  );

  const categoryNameOptions = categories
    .filter(cat => cat && cat.name)
    .map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));

  const subcategoryOptions = productForm.categoryId
    ? subcategories
      .filter((subcat) => subcat && subcat.categoryId === productForm.categoryId)
      .map((subcat) => ({ value: subcat.id, label: subcat.name }))
    : [];

  const subcategoryFilterOptions = subcategories
    .filter(subcat => subcat && subcat.name)
    .map((subcat) => ({ value: subcat.id, label: subcat.name }));

  const getBreadcrumbs = () => {
    let path = "Store Management";
    if (activeTab === "categories") path += " > Categories";
    else if (activeTab === "subcategories") path += " > Subcategories";
    else if (activeTab === "products") path += " > Products";
    return path;
  };

  // helper to apply select styles with invalid visual state
  const getSelectStyles = (invalid = false) => ({
    ...selectStyles,
    control: (provided) => {
      const base = selectStyles.control(provided);
      return {
        ...base,
        borderColor: invalid ? '#ef4444' : base.borderColor,
        boxShadow: invalid ? '0 0 0 4px rgba(239,68,68,0.08)' : base.boxShadow,
      };
    }
  });

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
    } else if (activeTab === "subcategories") {
      setSearchSubcategory("");
      setSelectedCategoryFilter(null);
    } else if (activeTab === "products") {
      setSearchProduct("");
      setSelectedSubcategoryFilter(null);
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
  disabled={!canAddCategory()}
  style={{ 
    opacity: canAddCategory() ? 1 : 0.6,
    cursor: canAddCategory() ? 'pointer' : 'not-allowed'
  }}
>
  + Add Category
</button>
        </div>
      </div>

      {showCategoryForm && (
        <div className="modal-overlay">
          <div className="modal-contentM">
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
                {!editCategory ? (
  <div className="form-group">
    <label>
      <i className="bi bi-tag"></i>
      Select Category <span className="mandatory">*</span>
    </label>
    <Select
      className="filter-select"
      options={getAvailablePredefinedCategories()}
      value={categoryForm.selectedPredefinedCategory}
      onChange={handlePredefinedCategoryChange}
      placeholder="Choose a category"
      isClearable
      styles={getSelectStyles(!!categoryInvalid.selectedPredefinedCategory)}
    />
  </div>
) : (
  <div className="form-group">
    <label>
      <i className="bi bi-tag"></i>
      Category Name <span className="mandatory">*</span>
    </label>
    <div className="input-wrapper">
      <input
        name="name"
        value={categoryForm.name}
        disabled
        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
      />
    </div>
  </div>
)}

                <div className="form-group">
                  <label>
                    <i className="bi bi-text-paragraph"></i>
                    Description
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      name="description"
                      placeholder="Brief description of the category"
                      value={categoryForm.description}
                      onChange={handleCategoryChange}
                      maxLength={200}
                      rows={3}
                    />
                    <span className="char-count">{categoryForm.description.length}/200</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <i className="bi bi-image"></i>
                    Thumbnail Image
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
                        {categoryForm.thumbnailFile ? categoryForm.thumbnailFile.name : "Choose an image file (max 5MB)"}
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
                  <th>Description</th>
                  <th>Thumbnail</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat, i) => (
                  <tr key={cat.id || i}>
                    <td data-label="#">{i + 1}</td>
                    <td data-label="Name" className="name-cell">{cat.name}</td>
                    <td data-label="Description" className="description-cell">{cat.description || "N/A"}</td>
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

  const renderSubcategories = () => (
    <>
      <div className="lms-controls">
        <div className="lms-header">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchSubcategory}
            onChange={(e) => setSearchSubcategory(e.target.value)}
            className="search-input"
          />
          <Select
            className="filter-select"
            options={categoryNameOptions}
            value={selectedCategoryFilter}
            onChange={setSelectedCategoryFilter}
            placeholder="All Categories"
            isClearable
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <button
            className="btn-add"
            onClick={() => {
              setEditSubcategory(null);
              setSubcategoryForm(initialSubcategoryForm);
              setShowSubcategoryForm(true);
            }}
          >
            + Add Subcategory
          </button>
        </div>
      </div>

      {showSubcategoryForm && (
        <div className="modal-overlay">
          <div className="modal-contentM">
            <div className="modal-header">
              <h3>
                <i className="bi bi-folder-plus"></i>
                {editSubcategory ? "Edit Subcategory" : "Add New Subcategory"}
              </h3>
              <button className="modal-close" onClick={() => {
                if (subcategoryForm.thumbnailPreview) URL.revokeObjectURL(subcategoryForm.thumbnailPreview);
                setShowSubcategoryForm(false);
                setEditSubcategory(null);
                setSubcategoryForm(initialSubcategoryForm);
              }}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <div className="form-section-title">
                  <i className="bi bi-info-circle"></i>
                  Subcategory Information
                </div>
                
                <div className="form-group">
                  <label>
                    <i className="bi bi-folder"></i>
                    Category <span className="mandatory">*</span>
                  </label>
                  <Select
                    className="filter-select"
                    options={categoryNameOptions}
                    value={categoryNameOptions.find((option) => option.value === subcategoryForm.categoryId) || null}
                    onChange={handleSubcategoryChange}
                    placeholder="Select a category"
                    isClearable
                    styles={getSelectStyles(!!subcategoryInvalid.categoryId)}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className="bi bi-tag"></i>
                    Subcategory Name <span className="mandatory">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      name="name"
                      placeholder="e.g., Pens, Notebooks, Markers"
                      value={subcategoryForm.name}
                      onChange={handleSubcategoryOtherChange}
                      required
                      maxLength={100}
                      className={subcategoryInvalid.name ? 'input-invalid' : ''}
                    />
                    <span className="char-count">{subcategoryForm.name.length}/100</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <i className="bi bi-text-paragraph"></i>
                    Description
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      name="description"
                      placeholder="Brief description of the subcategory"
                      value={subcategoryForm.description}
                      onChange={handleSubcategoryOtherChange}
                      maxLength={200}
                      rows={3}
                    />
                    <span className="char-count">{subcategoryForm.description.length}/200</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <i className="bi bi-image"></i>
                    Thumbnail Image
                  </label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      name="thumbnail"
                      accept="image/*"
                      onChange={handleSubcategoryOtherChange}
                      className="file-input-hidden"
                      id="subcategory-thumbnail-input"
                    />
                    <label htmlFor="subcategory-thumbnail-input" className="file-input-label">
                      <span className="file-input-text">
                        {subcategoryForm.thumbnailFile ? subcategoryForm.thumbnailFile.name : "Choose an image file (max 5MB)"}
                      </span>
                      {subcategoryForm.thumbnailPreview && (
                        <div className="thumbnail-preview-inline">
                          <img src={subcategoryForm.thumbnailPreview} alt="Preview" />
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
                  if (subcategoryForm.thumbnailPreview) URL.revokeObjectURL(subcategoryForm.thumbnailPreview);
                  setShowSubcategoryForm(false);
                  setEditSubcategory(null);
                  setSubcategoryForm(initialSubcategoryForm);
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddSubcategory} disabled={isSubmittingSubcategory}>
                <i className="bi bi-check-circle me-1"></i>
                {editSubcategory ? "Update Subcategory" : "Save Subcategory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredSubcategories.length === 0 ? (
        renderNoResults("subcategories")
      ) : (
        <div className="lms-table-container">
          <table className="lms-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Thumbnail</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubcategories.map((subcat, i) => (
                <tr key={subcat.id || i}>
                  <td data-label="#">{i + 1}</td>
                  <td data-label="Name" className="name-cell">{subcat.name}</td>
                  <td data-label="Category">{subcat.categoryName}</td>
                  <td data-label="Description" className="description-cell">{subcat.description || "N/A"}</td>
                  <td data-label="Thumbnail">
                    {subcat.thumbnail ? (
                      <img src={subcat.thumbnail} alt={subcat.name} width="50" className="category-thumbnail" />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td data-label="Created Date">{subcat.date}</td>
                  <td data-label="Actions">
                    <button className="btn-edit" onClick={() => handleEditSubcategory(subcat)}>
                      Edit
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => prepareRemoveSubcategory(subcat)}
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

  const renderProducts = () => (
    <>
      <div className="lms-controls">
        <div className="lms-header">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="search-input"
          />
          <Select
            className="filter-select"
            options={subcategoryFilterOptions}
            value={selectedSubcategoryFilter}
            onChange={setSelectedSubcategoryFilter}
            placeholder="All Subcategories"
            isClearable
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <button
            className="btn-add"
            onClick={() => {
              setEditProduct(null);
              setProductForm(initialProductForm);
              setProductAttributes([]);
              setShowProductForm(true);
            }}
          >
            + Add Product
          </button>
        </div>
      </div>

      {showProductForm && (
        <div className="modal-overlay">
          <div className="modal-contentM course-modal-no-scroll">
            <div className="modal-header">
              <h3>
                <i className="bi bi-box-seam"></i>
                {editProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  if (productForm.thumbnailPreview) URL.revokeObjectURL(productForm.thumbnailPreview);
                  setShowProductForm(false);
                  setEditProduct(null);
                  setProductForm(initialProductForm);
                  setProductAttributes([]);
                  setShowAttributeForm(false);
                  setEditingAttributeIndex(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="course-form-container">
                {/* Basic Information Section with Image on Right */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-info-circle"></i>
                    Basic Information
                  </div>
                  <div className="form-row-image-layout">
                    <div className="form-left-column">
                      <div className="form-group">
                        <label>
                          <i className="bi bi-card-heading"></i>
                          Product Name <span className="mandatory">*</span>
                        </label>
                        <div className="input-wrapper">
                          <input
                            name="name"
                            placeholder="e.g., Reynolds Pen, A4 Notebook"
                            value={productForm.name}
                            onChange={handleProductOtherChange}
                            maxLength={200}
                            className={productInvalid.name ? 'input-invalid' : ''}
                          />
                          <span className="char-count">{productForm.name.length}/200</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          <i className="bi bi-text-paragraph"></i>
                          Description
                        </label>
                        <div className="input-wrapper">
                          <textarea
                            name="description"
                            placeholder="Brief description of the product"
                            value={productForm.description}
                            onChange={handleProductOtherChange}
                            maxLength={500}
                            rows={5}
                          />
                          <span className="char-count">{productForm.description.length}/500</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-right-column">
                      <div className="form-group">
                        <label>
                          <i className="bi bi-image"></i>
                          Product Image
                        </label>
                        <div className="file-input-wrapper-vertical">
                          <input
                            type="file"
                            name="thumbnail"
                            accept="image/*"
                            onChange={handleProductOtherChange}
                            className="file-input-hidden"
                            id="product-thumbnail-input"
                          />
                          {productForm.thumbnailPreview ? (
                            <div className="thumbnail-preview-large">
                              <img src={productForm.thumbnailPreview} alt="Product Preview" />
                              <label htmlFor="product-thumbnail-input" className="change-image-btn">
                                <i className="bi bi-camera"></i> Change Image
                              </label>
                            </div>
                          ) : (
                            <label htmlFor="product-thumbnail-input" className="file-input-label-vertical">
                              <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '1rem' }}></i>
                              <span className="file-input-text">Click to upload image</span>
                              <span className="file-input-subtext">Max size: 5MB</span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-folder"></i>
                    Category & Subcategory
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
                        value={categoryNameOptions.find((option) => option.value === productForm.categoryId) || null}
                        onChange={handleProductCategoryChange}
                        placeholder="Select a category"
                        isClearable
                        styles={getSelectStyles(!!productInvalid.categoryId)}
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-folder2-open"></i>
                        Subcategory <span className="mandatory">*</span>
                      </label>
                      <Select
                        className="filter-select"
                        options={subcategoryOptions}
                        value={subcategoryOptions.find((option) => option.value === productForm.subCategoryId) || null}
                        onChange={handleProductSubcategoryChange}
                        placeholder="Select a subcategory"
                        isClearable
                        styles={getSelectStyles(!!productInvalid.subCategoryId)}
                        isDisabled={!productForm.categoryId}
                      />
                    </div>
                  </div>
                </div>

                {/* Product Details Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-card-list"></i>
                    Product Details
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-upc"></i>
                        SKU <span className="mandatory">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="sku"
                          placeholder="e.g., PEN-REY-001"
                          value={productForm.sku}
                          onChange={handleProductOtherChange}
                          maxLength={50}
                          className={productInvalid.sku ? 'input-invalid' : ''}
                        />
                        <span className="char-count">{productForm.sku.length}/50</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-hash"></i>
                        HSN Code
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="hsn"
                          placeholder="e.g., 49011010"
                          value={productForm.hsn}
                          onChange={handleProductOtherChange}
                          maxLength={8}
                        />
                        <span className="char-count">{productForm.hsn.length}/8</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-percent"></i>
                        GST Rate (%)
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="gstRate"
                          type="number"
                          placeholder="e.g., 18"
                          value={productForm.gstRate}
                          onChange={handleProductOtherChange}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-box"></i>
                        Unit
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="unit"
                          placeholder="e.g., piece, kg, box"
                          value={productForm.unit}
                          onChange={handleProductOtherChange}
                          maxLength={20}
                        />
                        <span className="char-count">{productForm.unit.length}/20</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-tags"></i>
                    Pricing & Stock
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
                          placeholder="₹10"
                          value={productForm.price}
                          onChange={handleProductOtherChange}
                          min="0"
                          step="0.01"
                          className={productInvalid.price ? 'input-invalid' : ''}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <i className="bi bi-tag"></i>
                        Original Price
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="actualPrice"
                          type="number"
                          placeholder="₹15"
                          value={productForm.actualPrice}
                          onChange={handleProductOtherChange}
                          min="0"
                          step="0.01"
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
                          value={`${calculateDiscount(productForm.price, productForm.actualPrice)}%`}
                          disabled
                          style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <i className="bi bi-boxes"></i>
                        Stock Quantity
                      </label>
                      <div className="input-wrapper">
                        <input
                          name="stock"
                          type="number"
                          placeholder="e.g., 100"
                          value={productForm.stock}
                          onChange={handleProductOtherChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Attributes/Variants Section */}
                <div className="form-section">
                  <div className="form-section-title">
                    <i className="bi bi-sliders"></i>
                    Product Variants (Optional)
                    <span style={{ fontSize: '0.75rem', fontWeight: '400', marginLeft: '0.5rem', color: '#6b7280' }}>
                      Add variants like Weight (20g, 50g), Size (S, M, L), etc.
                    </span>
                  </div>

                  {/* Attributes List */}
                  {productAttributes.length > 0 && (
                    <div className="attributes-list">
                      <div className="attributes-grid">
                        {productAttributes.map((attr, index) => (
                          <div key={index} className="attribute-card">
                            <div className="attribute-card-header">
                              <span className="attribute-badge">{attr.attributeName}</span>
                              <div className="attribute-actions">
                                <button
                                  className="btn-icon-edit"
                                  onClick={() => handleEditAttribute(index)}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn-icon-delete"
                                  onClick={() => handleDeleteAttribute(index)}
                                  title="Delete"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                            <div className="attribute-card-body">
                              <div className="attribute-detail">
                                <span className="attribute-label">Value:</span>
                                <span className="attribute-value">{attr.attributeValue}</span>
                              </div>
                              <div className="attribute-detail">
                                <span className="attribute-label">SKU:</span>
                                <span className="attribute-value">{attr.sku}</span>
                              </div>
                              <div className="attribute-detail">
                                <span className="attribute-label">Price:</span>
                                <span className="attribute-value price-highlight">
                                  ₹{attr.price}
                                  {attr.actualPrice && (
                                    <>
                                      {" "}
                                      <span className="strike-small">₹{attr.actualPrice}</span>
                                      <span className="discount-badge-small">
                                        {calculateAttributeDiscount(attr.price, attr.actualPrice)}% OFF
                                      </span>
                                    </>
                                  )}
                                </span>
                              </div>
                              <div className="attribute-detail">
                                <span className="attribute-label">Stock:</span>
                                <span className="attribute-value">{attr.stock || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Attribute Button */}
                  {!showAttributeForm && (
                    <button
                      className="btn-add-attribute"
                      onClick={() => {
                        setShowAttributeForm(true);
                        setEditingAttributeIndex(null);
                        setAttributeForm({
                          attributeName: "",
                          attributeValue: "",
                          price: "",
                          actualPrice: "",
                          stock: "",
                          sku: "",
                        });
                      }}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Add Variant
                    </button>
                  )}

                  {/* Attribute Form */}
                  {showAttributeForm && (
                    <div className="attribute-form">
                      <div className="attribute-form-header">
                        <h4>
                          <i className="bi bi-sliders2"></i>
                          {editingAttributeIndex !== null ? "Edit Variant" : "Add New Variant"}
                        </h4>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            <i className="bi bi-tag-fill"></i>
                            Attribute Type <span className="mandatory">*</span>
                          </label>
                          <div className="input-wrapper">
                            <input
                              name="attributeName"
                              placeholder="e.g., Weight, Size, Volume, Color"
                              value={attributeForm.attributeName}
                              onChange={handleAttributeChange}
                              maxLength={100}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>
                            <i className="bi bi-tags-fill"></i>
                            Attribute Value <span className="mandatory">*</span>
                          </label>
                          <div className="input-wrapper">
                            <input
                              name="attributeValue"
                              placeholder="e.g., 20g, Small, 500ml, Red"
                              value={attributeForm.attributeValue}
                              onChange={handleAttributeChange}
                              maxLength={50}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            <i className="bi bi-upc-scan"></i>
                            Variant SKU <span className="mandatory">*</span>
                          </label>
                          <div className="input-wrapper">
                            <input
                              name="sku"
                              placeholder="e.g., PEN-REY-001-20G"
                              value={attributeForm.sku}
                              onChange={handleAttributeChange}
                              maxLength={50}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>
                            <i className="bi bi-boxes"></i>
                            Stock Quantity
                          </label>
                          <div className="input-wrapper">
                            <input
                              name="stock"
                              type="number"
                              placeholder="e.g., 100"
                              value={attributeForm.stock}
                              onChange={handleAttributeChange}
                              min="0"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            <i className="bi bi-currency-rupee"></i>
                            Selling Price <span className="mandatory">*</span>
                          </label>
                          <div className="input-wrapper">
                            <input
                              name="price"
                              type="number"
                              placeholder="₹10"
                              value={attributeForm.price}
                              onChange={handleAttributeChange}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>
                            <i className="bi bi-tag"></i>
                            Original Price
                          </label>
                          <div className="input-wrapper">
                            <input
                              name="actualPrice"
                              type="number"
                              placeholder="₹15"
                              value={attributeForm.actualPrice}
                              onChange={handleAttributeChange}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="attribute-form-actions">
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setShowAttributeForm(false);
                            setEditingAttributeIndex(null);
                            setAttributeForm({
                              attributeName: "",
                              attributeValue: "",
                              price: "",
                              actualPrice: "",
                              stock: "",
                              sku: "",
                            });
                          }}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Cancel
                        </button>
                        <button className="btn-save" onClick={handleAddAttribute}>
                          <i className="bi bi-check-circle me-1"></i>
                          {editingAttributeIndex !== null ? "Update Variant" : "Add Variant"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  if (productForm.thumbnailPreview) URL.revokeObjectURL(productForm.thumbnailPreview);
                  setShowProductForm(false);
                  setEditProduct(null);
                  setProductForm(initialProductForm);
                  setProductAttributes([]);
                  setShowAttributeForm(false);
                  setEditingAttributeIndex(null);
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleAddProduct}
                disabled={isSubmittingProduct}
              >
                <i className="bi bi-check-circle me-1"></i>
                {editProduct ? "Update Product" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        renderNoResults("products")
      ) : (
        <div className="lms-table-container">
          <table className="lms-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Variants</th>
                <th>Discount</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, i) => (
                <tr key={p.id || i}>
                  <td data-label="#">{i + 1}</td>
                  <td data-label="Name" className="name-cell">{p.name}</td>
                  <td data-label="SKU">{p.sku}</td>
                  <td data-label="Category">{p.categoryName}</td>
                  <td data-label="Subcategory">{p.subCategoryName}</td>
                  <td data-label="Variants">
                    {p.attributes && p.attributes.length > 0 ? (
                      <span className="variants-badge">{p.attributes.length} variants</span>
                    ) : (
                      <span className="no-variants">No variants</span>
                    )}
                  </td>
                  <td data-label="Discount">{calculateDiscount(p.price, p.actualPrice)}%</td>
                  <td data-label="Price">
                    ₹{p.price} {p.actualPrice && <span className="strike">₹{p.actualPrice}</span>}
                  </td>
                  <td data-label="Stock">
  {getStockDisplay(p)}
</td>
                  <td data-label="Created Date">{p.date}</td>
                  <td data-label="Actions">
                    <button className="btn-edit" onClick={() => handleEditProduct(p)}>
                      Edit
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => prepareRemoveProduct(p)}
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
              <i className="bi bi-shop me-2"></i>
              Store Management
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
              <span className="stat-number">{subcategories.length}</span>
              <span className="stat-labelR">Subcategories</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{products.length}</span>
              <span className="stat-labelR">Products</span>
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
          className={activeTab === "subcategories" ? "active" : ""}
          onClick={() => setActiveTab("subcategories")}
        >
          Subcategories
        </button>
        <button
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
      </div>

      {activeTab === "categories" && renderCategories()}
      {activeTab === "subcategories" && renderSubcategories()}
      {activeTab === "products" && renderProducts()}

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
          <div className="modal-contentM delete-modal">
            <div className="modal-header">
              <h3>
                <i className="bi bi-exclamation-triangle"></i>
                Confirm Deletion
              </h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete this {deleteType}? 
                {deleteType === "category" ? " This will also delete related subcategories and products." : 
                 deleteType === "subcategory" ? " This will also delete related products." : ""}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button className="btn-remove" onClick={confirmRemove}>
                <i className="bi bi-trash me-1"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagement;