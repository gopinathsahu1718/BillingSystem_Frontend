import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import "./CartBilling.css";
import { useAuth } from "../../context/AuthContext";

const CartBilling = () => {
  const BASE_URL = 'http://13.232.200.172/api';
  const STORE_BASE_URL = 'http://13.232.200.172/api/store';
  const STATIC_BASE = 'http://13.232.200.172';
  const { token } = useAuth();

  // Product listing states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Cart states
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: "0.00",
    totalGST: "0.00",
    grandTotal: "0.00"
  });
  const [totalCartItems, setTotalCartItems] = useState(0);

  // UI states
  const [activeView, setActiveView] = useState("products"); // products, cart, billing
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [selectedProductForCart, setSelectedProductForCart] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [toasts, setToasts] = useState([]);

  // Billing states
  const [billingForm, setBillingForm] = useState({
    customerName: "",
    customerContact: "",
    customerEmail: "",
    customerAddress: "",
    paymentMode: "cash",
    notes: ""
  });

  const [isGeneratingBill, setIsGeneratingBill] = useState(false);

  // Fetch products, categories, and subcategories
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !token.trim()) {
        console.warn("No valid token available.");
        setLoadingProducts(false);
        return;
      }

      try {
        setLoadingProducts(true);

        // Fetch categories
        const catResponse = await axios.get(`${STORE_BASE_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedCategories = catResponse.data?.success && Array.isArray(catResponse.data.data)
          ? catResponse.data.data.map((cat) => ({
              id: cat.id,
              name: cat.name,
            }))
          : [];

        setCategories(fetchedCategories);

        // Fetch subcategories
        const subcatResponse = await axios.get(`${STORE_BASE_URL}/subcategories`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedSubcategories = subcatResponse.data?.success && Array.isArray(subcatResponse.data.data)
          ? subcatResponse.data.data.map((subcat) => ({
              id: subcat.id,
              name: subcat.name,
              categoryId: subcat.categoryId,
            }))
          : [];

        setSubcategories(fetchedSubcategories);

        // Fetch products with attributes
        const productResponse = await axios.get(`${STORE_BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (productResponse.data?.success && Array.isArray(productResponse.data.data)) {
          const fetchedProducts = productResponse.data.data.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description || "",
            categoryId: product.categoryId,
            categoryName: product.category?.name || 'Uncategorized',
            subCategoryId: product.subCategoryId,
            subCategoryName: product.subcategory?.name || 'Uncategorized',
            sku: product.sku,
            price: parseFloat(product.price) || 0,
            actualPrice: parseFloat(product.actualPrice) || 0,
            stock: product.stock || 0,
            unit: product.unit || "piece",
            gstRate: parseFloat(product.gstRate) || 0,
            thumbnail: product.thumbnailImageUrl || null,
            attributes: product.attributes || [],
            isActive: product.isActive !== 0,
          }));

          setProducts(fetchedProducts);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showToast("error", "Error", "Failed to load products.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, [token]);

  // Fetch cart items
  const fetchCart = useCallback(async () => {
    if (!token || !token.trim()) return;

    try {
      const response = await axios.get(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setCartItems(response.data.data || []);
        setCartSummary(response.data.summary || {
          subtotal: "0.00",
          totalGST: "0.00",
          grandTotal: "0.00"
        });
        setTotalCartItems(response.data.totalItems || 0);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      showToast("error", "Error", "Failed to load cart.");
    }
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const showToast = (type, title, description) => {
    const id = Date.now();
    setToasts([{ id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const handleAddToCart = (product, attribute = null) => {
    setSelectedProductForCart(product);
    if (product.attributes && product.attributes.length > 0 && !attribute) {
      setShowAttributeModal(true);
      setSelectedAttribute(null);
      setQuantity(1);
    } else {
      addToCartAPI(product, attribute, 1);
    }
  };

  const addToCartAPI = async (product, attribute, qty) => {
    try {
      const payload = {
        productId: product.id,
        quantity: qty,
      };

      if (attribute) {
        payload.attributeId = attribute.id;
      }

      const response = await axios.post(`${BASE_URL}/cart`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data?.success) {
        showToast("success", "Success", response.data.message || "Added to cart!");
        fetchCart();
        setShowAttributeModal(false);
        setSelectedProductForCart(null);
        setSelectedAttribute(null);
        setQuantity(1);
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      const errorMsg = error.response?.data?.message || "Failed to add to cart.";
      showToast("error", "Error", errorMsg);
    }
  };

  const updateCartItem = async (cartId, action, newQuantity = null) => {
    try {
      const payload = newQuantity !== null ? { quantity: newQuantity } : { action };

      const response = await axios.put(`${BASE_URL}/cart/${cartId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data?.success) {
        showToast("success", "Updated", "Cart updated successfully.");
        fetchCart();
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
      const errorMsg = error.response?.data?.message || "Failed to update cart.";
      showToast("error", "Error", errorMsg);
    }
  };

  const removeCartItem = async (cartId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/cart/${cartId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        showToast("success", "Removed", "Item removed from cart.");
        fetchCart();
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
      const errorMsg = error.response?.data?.message || "Failed to remove item.";
      showToast("error", "Error", errorMsg);
    }
  };

  const handleGenerateBill = async () => {
    if (!billingForm.customerName.trim() || !billingForm.customerContact.trim()) {
      showToast("error", "Error", "Customer name and contact are required.");
      return;
    }

    if (cartItems.length === 0) {
      showToast("error", "Error", "Cart is empty.");
      return;
    }

    setIsGeneratingBill(true);
    try {
      // Here you would call your billing API
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));

      showToast("success", "Success", "Bill generated successfully!");
      
      // Reset
      setBillingForm({
        customerName: "",
        customerContact: "",
        customerEmail: "",
        customerAddress: "",
        paymentMode: "cash",
        notes: ""
      });
      setActiveView("products");
      fetchCart(); // Refresh cart (it should be empty after billing)
    } catch (error) {
      console.error("Failed to generate bill:", error);
      showToast("error", "Error", "Failed to generate bill.");
    } finally {
      setIsGeneratingBill(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory.value;
    const matchesSubcategory = !selectedSubcategory || p.subCategoryId === selectedSubcategory.value;
    const isActive = p.isActive;

    return matchesSearch && matchesCategory && matchesSubcategory && isActive;
  });

  const categoryOptions = categories.map((cat) => ({ value: cat.id, label: cat.name }));
  const subcategoryOptions = selectedCategory
    ? subcategories.filter((sc) => sc.categoryId === selectedCategory.value).map((sc) => ({ value: sc.id, label: sc.name }))
    : subcategories.map((sc) => ({ value: sc.id, label: sc.name }));

  const activeFiltersCount = [searchTerm, selectedCategory, selectedSubcategory].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "42px",
      borderRadius: "10px",
      borderColor: "#9ca3af",
      backgroundColor: "#ffffff",
      "&:hover": { borderColor: "#667eea" }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#ffffff",
      zIndex: 100,
    }),
  };

  const calculateDiscount = (price, actualPrice) => {
    if (!actualPrice || price >= actualPrice) return 0;
    return Math.round(((actualPrice - price) / actualPrice) * 100);
  };

  // Product Table Row Component
  const ProductTableRow = ({ product, index, onAddToCart, showAttributeModal }) => {
    const [localQuantity, setLocalQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Check if product or variant is in cart
    const isInCart = (productId, variantId = null) => {
      return cartItems.some(item => 
        item.productId === productId && 
        (variantId ? item.attributeId === variantId : !item.attributeId)
      );
    };

    // Get quantity in cart for product or variant
    const getCartQuantity = (productId, variantId = null) => {
      const cartItem = cartItems.find(item => 
        item.productId === productId && 
        (variantId ? item.attributeId === variantId : !item.attributeId)
      );
      return cartItem ? cartItem.quantity : 0;
    };

    // Check available stock (considering cart quantity)
    const getAvailableStock = (stock, productId, variantId = null) => {
      const cartQty = getCartQuantity(productId, variantId);
      return stock - cartQty;
    };

    const productInCart = isInCart(product.id);
    const variantInCart = selectedVariant ? isInCart(product.id, selectedVariant.id) : false;
    const availableStock = selectedVariant 
      ? getAvailableStock(selectedVariant.stock, product.id, selectedVariant.id)
      : getAvailableStock(product.stock, product.id);

    const handleQuickAdd = () => {
      if (product.attributes && product.attributes.length > 0) {
        showAttributeModal();
      } else {
        if (localQuantity > availableStock) {
          showToast("error", "Error", `Only ${availableStock} units available (${getCartQuantity(product.id)} already in cart)`);
          return;
        }
        addToCartAPI(product, null, localQuantity);
        setLocalQuantity(1);
      }
    };

    const handleVariantAdd = (variant) => {
      const variantAvailableStock = getAvailableStock(variant.stock, product.id, variant.id);
      if (localQuantity > variantAvailableStock) {
        showToast("error", "Error", `Only ${variantAvailableStock} units available for this variant (${getCartQuantity(product.id, variant.id)} already in cart)`);
        return;
      }
      addToCartAPI(product, variant, localQuantity);
      setLocalQuantity(1);
      setSelectedVariant(null);
    };

    return (
      <tr className={availableStock <= 0 ? 'out-of-stock-row' : ''}>
        <td data-label="S.No">{index + 1}</td>
        <td data-label="Image">
          <div className="product-table-image">
            {product.thumbnail ? (
              <img src={product.thumbnail} alt={product.name} />
            ) : (
              <div className="no-image-icon">
                <i className="bi bi-box-seam"></i>
              </div>
            )}
            {/* Cart Badge on Image */}
            {(productInCart || variantInCart) && (
              <div className="in-cart-badge">
                <i className="bi bi-cart-check-fill"></i>
              </div>
            )}
          </div>
        </td>
        <td data-label="Product Details" className="product-details-cell">
          <div className="product-info">
            <h4 className="product-table-name">
              {product.name}
              {productInCart && !selectedVariant && (
                <span className="in-cart-indicator" title={`${getCartQuantity(product.id)} in cart`}>
                  <i className="bi bi-cart-check-fill"></i> In Cart
                </span>
              )}
            </h4>
            <p className="product-table-sku">
              <i className="bi bi-upc"></i> {product.sku}
            </p>
            {product.description && (
              <p className="product-table-desc">{product.description}</p>
            )}
          </div>
        </td>
        <td data-label="Category">
          <div className="category-badge">
            <i className="bi bi-folder"></i> {product.categoryName}
          </div>
          <div className="subcategory-badge">
            <i className="bi bi-folder2-open"></i> {product.subCategoryName}
          </div>
        </td>
        <td data-label="Price">
          <div className="price-info">
            <span className="price-current">₹{product.price}</span>
            {product.actualPrice > product.price && (
              <>
                <span className="price-original">₹{product.actualPrice}</span>
                <span className="price-discount">{calculateDiscount(product.price, product.actualPrice)}% OFF</span>
              </>
            )}
          </div>
        </td>
        <td data-label="Stock">
          <div className={`stock-badge ${availableStock <= 0 ? 'out-of-stock' : availableStock <= 10 ? 'low-stock' : 'in-stock'}`}>
            <i className="bi bi-boxes"></i> {availableStock} {product.unit}
          </div>
          {(productInCart || variantInCart) && (
            <div className="cart-stock-info">
              <i className="bi bi-info-circle"></i> {selectedVariant ? getCartQuantity(product.id, selectedVariant.id) : getCartQuantity(product.id)} in cart
            </div>
          )}
        </td>
        <td data-label="Variants">
          {product.attributes && product.attributes.length > 0 ? (
            <div className="variants-cell">
              <button 
                className="btn-view-variants"
                onClick={showAttributeModal}
              >
                <i className="bi bi-list-ul"></i> {product.attributes.length} Variant{product.attributes.length > 1 ? 's' : ''}
              </button>
              <div className="variant-quick-select">
                {product.attributes.slice(0, 3).map((attr) => {
                  const attrInCart = isInCart(product.id, attr.id);
                  const attrAvailableStock = getAvailableStock(attr.stock, product.id, attr.id);
                  return (
                    <button
                      key={attr.id}
                      className={`variant-chip ${selectedVariant?.id === attr.id ? 'selected' : ''} ${attrAvailableStock <= 0 ? 'disabled' : ''} ${attrInCart ? 'in-cart-chip' : ''}`}
                      onClick={() => attrAvailableStock > 0 && setSelectedVariant(attr)}
                      disabled={attrAvailableStock <= 0}
                      title={`${attr.attributeName}: ${attr.attributeValue} - Available: ${attrAvailableStock}${attrInCart ? ` (${getCartQuantity(product.id, attr.id)} in cart)` : ''}`}
                    >
                      {attrInCart && <i className="bi bi-cart-check-fill"></i>}
                      {attr.attributeValue}
                    </button>
                  );
                })}
                {product.attributes.length > 3 && (
                  <button className="variant-chip more" onClick={showAttributeModal}>
                    +{product.attributes.length - 3}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <span className="no-variants">No variants</span>
          )}
        </td>
        <td data-label="Quantity">
          <div className="quantity-input-table">
            <button
              className="qty-btn-table"
              onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
              disabled={localQuantity <= 1}
            >
              <i className="bi bi-dash"></i>
            </button>
            <input
              type="number"
              value={localQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                const maxStock = selectedVariant ? selectedVariant.stock : product.stock;
                setLocalQuantity(Math.max(1, Math.min(maxStock, val)));
              }}
              min="1"
              max={selectedVariant ? selectedVariant.stock : product.stock}
            />
            <button
              className="qty-btn-table"
              onClick={() => {
                const maxStock = selectedVariant ? selectedVariant.stock : product.stock;
                setLocalQuantity(Math.min(maxStock, localQuantity + 1));
              }}
              disabled={localQuantity >= (selectedVariant ? selectedVariant.stock : product.stock)}
            >
              <i className="bi bi-plus"></i>
            </button>
          </div>
        </td>
        <td data-label="Actions">
          {selectedVariant ? (
            <button
              className={`btn-add-to-cart-table ${variantInCart ? 'btn-in-cart' : ''}`}
              onClick={() => handleVariantAdd(selectedVariant)}
              disabled={availableStock <= 0}
            >
              {availableStock <= 0 ? (
                <>
                  <i className="bi bi-x-circle"></i> Out of Stock
                </>
              ) : variantInCart ? (
                <>
                  <i className="bi bi-cart-plus"></i> Add More {selectedVariant.attributeValue}
                </>
              ) : (
                <>
                  <i className="bi bi-cart-plus"></i> Add {selectedVariant.attributeValue}
                </>
              )}
            </button>
          ) : (
            <button
              className={`btn-add-to-cart-table ${productInCart ? 'btn-in-cart' : ''}`}
              onClick={handleQuickAdd}
              disabled={availableStock <= 0}
            >
              {availableStock <= 0 ? (
                <>
                  <i className="bi bi-x-circle"></i> Out of Stock
                </>
              ) : productInCart ? (
                <>
                  <i className="bi bi-cart-plus"></i> Add More
                </>
              ) : (
                <>
                  <i className="bi bi-cart-plus"></i> Add to Cart
                </>
              )}
            </button>
          )}
        </td>
      </tr>
    );
  };

  const renderProductCard = (product) => (
    <div className="product-card" key={product.id}>
      <div className="product-image">
        {product.thumbnail ? (
          <img src={product.thumbnail} alt={product.name} />
        ) : (
          <div className="no-image">
            <i className="bi bi-box-seam"></i>
          </div>
        )}
        {product.actualPrice > product.price && (
          <div className="discount-badge">
            {calculateDiscount(product.price, product.actualPrice)}% OFF
          </div>
        )}
        {product.stock <= 0 && (
          <div className="out-of-stock-overlay">
            <span>Out of Stock</span>
          </div>
        )}
      </div>
      <div className="product-details">
        <h3 className="product-name" title={product.name}>{product.name}</h3>
        <p className="product-category">
          <i className="bi bi-folder"></i> {product.categoryName} › {product.subCategoryName}
        </p>
        <p className="product-sku">
          <i className="bi bi-upc"></i> {product.sku}
        </p>
        <div className="product-pricing">
          <span className="product-price">₹{product.price}</span>
          {product.actualPrice > product.price && (
            <span className="product-actual-price">₹{product.actualPrice}</span>
          )}
        </div>
        <div className="product-stock">
          <i className="bi bi-boxes"></i> Stock: {product.stock} {product.unit}
        </div>
        {product.attributes && product.attributes.length > 0 && (
          <div className="product-variants">
            <i className="bi bi-list-ul"></i> {product.attributes.length} variant{product.attributes.length > 1 ? 's' : ''} available
          </div>
        )}
        <button
          className="btn-add-to-cart"
          onClick={() => handleAddToCart(product)}
          disabled={product.stock <= 0 && (!product.attributes || product.attributes.length === 0)}
        >
          <i className="bi bi-cart-plus"></i> Add to Cart
        </button>
      </div>
    </div>
  );

  const renderProductsView = () => (
    <div className="products-view">
      <div className="products-header">
        <div className="search-filters">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input search-input-combined"
            />
            <i className="bi bi-search search-icon"></i>
          </div>
          <Select
            options={categoryOptions}
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val);
              if (!val) setSelectedSubcategory(null);
            }}
            placeholder="All Categories"
            isClearable
            styles={selectStyles}
            className="filter-select"
          />
          <Select
            options={subcategoryOptions}
            value={selectedSubcategory}
            onChange={setSelectedSubcategory}
            placeholder="All Subcategories"
            isClearable
            styles={selectStyles}
            className="filter-select"
            isDisabled={selectedCategory && subcategoryOptions.length === 0}
          />
          {activeFiltersCount > 0 && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              <i className="bi bi-x-circle"></i> Clear {activeFiltersCount} Filter{activeFiltersCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <div className="filter-info">
            <i className="bi bi-funnel"></i>
            <span>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found</span>
          </div>
        )}
      </div>

      {loadingProducts ? (
        <div className="loading-container">
          <i className="bi bi-hourglass-split"></i>
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-results">
          <i className="bi bi-inbox"></i>
          <p>No products found</p>
          {activeFiltersCount > 0 && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Image</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Variants</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <ProductTableRow 
                  key={product.id} 
                  product={product} 
                  index={index}
                  onAddToCart={handleAddToCart}
                  showAttributeModal={() => {
                    setSelectedProductForCart(product);
                    setShowAttributeModal(true);
                    setSelectedAttribute(null);
                    setQuantity(1);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderCartView = () => (
    <div className="cart-view">
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <i className="bi bi-cart-x"></i>
          <h3>Your cart is empty</h3>
          <p>Add products to get started</p>
          <button className="btn-browse" onClick={() => setActiveView("products")}>
            <i className="bi bi-shop"></i> Browse Products
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-image">
                  {item.product?.thumbnailImageUrl ? (
                    <img src={item.product.thumbnailImageUrl} alt={item.product?.name} />
                  ) : (
                    <div className="no-image-small">
                      <i className="bi bi-box-seam"></i>
                    </div>
                  )}
                </div>
                <div className="cart-item-details">
                  <h4>{item.product?.name}</h4>
                  {item.attribute && (
                    <p className="cart-item-variant">
                      <i className="bi bi-tag"></i> {item.attribute.attributeName}: {item.attribute.attributeValue}
                    </p>
                  )}
                  <p className="cart-item-sku">SKU: {item.effectiveSKU}</p>
                  <p className="cart-item-price">₹{item.effectivePrice} × {item.quantity}</p>
                  {item.product?.gstRate > 0 && (
                    <p className="cart-item-gst">GST ({item.product.gstRate}%): ₹{item.itemGST}</p>
                  )}
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button
                      className="qty-btn"
                      onClick={() => updateCartItem(item.id, "decrement")}
                      disabled={item.quantity <= 1}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateCartItem(item.id, "increment")}
                      disabled={item.quantity >= item.effectiveStock}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  <div className="cart-item-total">₹{item.itemTotal}</div>
                  <button className="btn-remove-item" onClick={() => removeCartItem(item.id)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal ({totalCartItems} items):</span>
              <span>₹{cartSummary.subtotal}</span>
            </div>
            <div className="summary-row">
              <span>GST:</span>
              <span>₹{cartSummary.totalGST}</span>
            </div>
            <div className="summary-row total">
              <span>Grand Total:</span>
              <span>₹{cartSummary.grandTotal}</span>
            </div>
            <button className="btn-proceed" onClick={() => setActiveView("billing")}>
              <i className="bi bi-arrow-right-circle"></i> Proceed to Billing
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderBillingView = () => (
    <div className="billing-view">
      <div className="billing-form">
        <h3>
          <i className="bi bi-person-badge"></i> Customer Details
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Customer Name <span className="mandatory">*</span></label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={billingForm.customerName}
              onChange={(e) => setBillingForm({ ...billingForm, customerName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Contact Number <span className="mandatory">*</span></label>
            <input
              type="tel"
              placeholder="Enter contact number"
              value={billingForm.customerContact}
              onChange={(e) => setBillingForm({ ...billingForm, customerContact: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email (optional)"
              value={billingForm.customerEmail}
              onChange={(e) => setBillingForm({ ...billingForm, customerEmail: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Payment Mode</label>
            <select
              value={billingForm.paymentMode}
              onChange={(e) => setBillingForm({ ...billingForm, paymentMode: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>
        <div className="form-group full-width">
          <label>Address</label>
          <textarea
            placeholder="Enter customer address (optional)"
            value={billingForm.customerAddress}
            onChange={(e) => setBillingForm({ ...billingForm, customerAddress: e.target.value })}
            rows={3}
          />
        </div>
        <div className="form-group full-width">
          <label>Notes</label>
          <textarea
            placeholder="Add any notes (optional)"
            value={billingForm.notes}
            onChange={(e) => setBillingForm({ ...billingForm, notes: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="billing-summary">
        <h3>
          <i className="bi bi-receipt"></i> Order Summary
        </h3>
        <div className="billing-items">
          {cartItems.map((item) => (
            <div className="billing-item" key={item.id}>
              <span className="billing-item-name">
                {item.product?.name}
                {item.attribute && ` (${item.attribute.attributeValue})`}
              </span>
              <span className="billing-item-qty">× {item.quantity}</span>
              <span className="billing-item-price">₹{item.itemTotal}</span>
            </div>
          ))}
        </div>
        <div className="billing-totals">
          <div className="billing-total-row">
            <span>Subtotal:</span>
            <span>₹{cartSummary.subtotal}</span>
          </div>
          <div className="billing-total-row">
            <span>GST:</span>
            <span>₹{cartSummary.totalGST}</span>
          </div>
          <div className="billing-total-row grand">
            <span>Grand Total:</span>
            <span>₹{cartSummary.grandTotal}</span>
          </div>
        </div>
        <div className="billing-actions">
          <button className="btn-back" onClick={() => setActiveView("cart")}>
            <i className="bi bi-arrow-left"></i> Back to Cart
          </button>
          <button
            className="btn-generate-bill"
            onClick={handleGenerateBill}
            disabled={isGeneratingBill}
          >
            {isGeneratingBill ? (
              <>
                <i className="bi bi-hourglass-split spinning"></i> Generating...
              </>
            ) : (
              <>
                <i className="bi bi-printer"></i> Generate Bill
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cart-billing-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-cart3"></i>
              Cart & Billing
            </h2>
            <div className="breadcrumbs">
              Cart & Billing {activeView === "cart" && "› Cart"} {activeView === "billing" && "› Billing"}
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{products.length}</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{totalCartItems}</span>
              <span className="stat-label">In Cart</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">₹{cartSummary.grandTotal}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={activeView === "products" ? "active" : ""}
          onClick={() => setActiveView("products")}
        >
          <i className="bi bi-shop"></i> Products
        </button>
        <button
          className={activeView === "cart" ? "active" : ""}
          onClick={() => setActiveView("cart")}
        >
          <i className="bi bi-cart3"></i> Cart {totalCartItems > 0 && `(${totalCartItems})`}
        </button>
        <button
          className={activeView === "billing" ? "active" : ""}
          onClick={() => setActiveView("billing")}
          disabled={cartItems.length === 0}
        >
          <i className="bi bi-receipt"></i> Billing
        </button>
      </div>

      <div className="main-content">
        {activeView === "products" && renderProductsView()}
        {activeView === "cart" && renderCartView()}
        {activeView === "billing" && renderBillingView()}
      </div>

      {/* Attribute Selection Modal */}
      {showAttributeModal && selectedProductForCart && (
        <div className="modal-overlay">
          <div className="modal-content attribute-modal">
            <div className="modal-header">
              <h3>
                <i className="bi bi-list-ul"></i> Select Variant
              </h3>
              <button className="modal-close" onClick={() => setShowAttributeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h4 className="product-modal-name">{selectedProductForCart.name}</h4>
              <div className="attributes-list">
                {selectedProductForCart.attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className={`attribute-option ${selectedAttribute?.id === attr.id ? 'selected' : ''} ${attr.stock <= 0 ? 'out-of-stock' : ''}`}
                    onClick={() => attr.stock > 0 && setSelectedAttribute(attr)}
                  >
                    <div className="attribute-info">
                      <span className="attribute-name">{attr.attributeName}: {attr.attributeValue}</span>
                      <span className="attribute-sku">SKU: {attr.sku}</span>
                      <span className="attribute-stock">Stock: {attr.stock}</span>
                    </div>
                    <div className="attribute-pricing">
                      <span className="attribute-price">₹{attr.price}</span>
                      {attr.actualPrice > attr.price && (
                        <span className="attribute-actual-price">₹{attr.actualPrice}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-input-group">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <i className="bi bi-dash"></i>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={selectedAttribute?.stock || selectedProductForCart.stock}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= (selectedAttribute?.stock || selectedProductForCart.stock)}
                  >
                    <i className="bi bi-plus"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAttributeModal(false)}>
                Cancel
              </button>
              <button
                className="btn-add-to-cart-modal"
                onClick={() => addToCartAPI(selectedProductForCart, selectedAttribute, quantity)}
                disabled={!selectedAttribute || selectedAttribute.stock <= 0}
              >
                <i className="bi bi-cart-plus"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-notification ${toast.type}`}>
            <div className="toast-content">
              <span className="toast-icon"></span>
              <div className="toast-body">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-description">{toast.description}</div>
              </div>
              <button
                className="toast-close"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartBilling;