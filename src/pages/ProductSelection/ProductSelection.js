import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import "./ProductSelection.css";
import { useAuth } from "../../context/AuthContext";

const ProductSelection = () => {
  const BASE_URL = 'http://13.232.200.172/api';
  const STORE_BASE_URL = 'http://13.232.200.172/api/store';
  const { token } = useAuth();

  // Product listing states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Cart states
  const [cartItems, setCartItems] = useState([]);

  // UI states
  const [activeCategory, setActiveCategory] = useState("laxmi_bookstore");
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [selectedProductForCart, setSelectedProductForCart] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [toasts, setToasts] = useState([]);

  // Category mapping - Update these IDs based on your actual database
  const CATEGORY_MAPPING = {
    laxmi_bookstore: { name: "Laxmi Bookstore", displayName: "Laxmi Bookstore" },
    swasthik_enterprises: { name: "Swasthik Enterprises", displayName: "Swasthik Enterprises" }
  };

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
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
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

  // Get current category ID based on active category
  const getCurrentCategoryId = () => {
    const category = categories.find(cat => 
      cat.name.toLowerCase().replace(/\s+/g, '_') === activeCategory
    );
    return category?.id;
  };

  // Get product counts for both categories
  const getLaxmiBookstoreCount = () => {
    const laxmiCategory = categories.find(cat => 
      cat.name.toLowerCase().replace(/\s+/g, '_') === 'laxmi_bookstore'
    );
    return products.filter(p => p.categoryId === laxmiCategory?.id && p.isActive).length;
  };

  const getSwasthikEnterprisesCount = () => {
    const swasthikCategory = categories.find(cat => 
      cat.name.toLowerCase().replace(/\s+/g, '_') === 'swasthik_enterprises'
    );
    return products.filter(p => p.categoryId === swasthikCategory?.id && p.isActive).length;
  };

  // Filter products by active category
  const filteredProducts = products.filter((p) => {
    const currentCategoryId = getCurrentCategoryId();
    const matchesCategory = p.categoryId === currentCategoryId;
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubcategory = !selectedSubcategory || p.subCategoryId === selectedSubcategory.value;
    const isActive = p.isActive;

    return matchesCategory && matchesSearch && matchesSubcategory && isActive;
  });

  // Get subcategories for active category
  const currentCategorySubcategories = subcategories
    .filter((sc) => sc.categoryId === getCurrentCategoryId())
    .map((sc) => ({ value: sc.id, label: sc.name }));

  const activeFiltersCount = [searchTerm, selectedSubcategory].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
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

  // Product Table Row Component
  const ProductTableRow = ({ product, index }) => {
    const [localQuantity, setLocalQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);

    const hasVariants = product.attributes && product.attributes.length > 0;

    // Check if any variant is in cart
    const hasAnyVariantInCart = hasVariants 
      ? product.attributes.some(attr => isInCart(product.id, attr.id))
      : false;

    const productInCart = isInCart(product.id);
    const variantInCart = selectedVariant ? isInCart(product.id, selectedVariant.id) : false;
    const availableStock = selectedVariant 
      ? getAvailableStock(selectedVariant.stock, product.id, selectedVariant.id)
      : getAvailableStock(product.stock, product.id);

    const handleQuickAdd = () => {
      if (hasVariants) {
        setSelectedProductForCart(product);
        setShowAttributeModal(true);
        setSelectedAttribute(null);
        setQuantity(1);
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
            {(productInCart || variantInCart || hasAnyVariantInCart) && (
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
              {(productInCart || hasAnyVariantInCart) && !selectedVariant && (
                <span className="in-cart-indicator" title={`${productInCart ? getCartQuantity(product.id) : 'Variants'} in cart`}>
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
        <td data-label="Subcategory">
          <div className="subcategory-badge">
            <i className="bi bi-folder2-open"></i> {product.subCategoryName}
          </div>
        </td>
        <td data-label="Price">
          <div className="price-info">
            <span className="price-current">₹{product.price}</span>
            {product.actualPrice > product.price && (
              <span className="price-original">₹{product.actualPrice}</span>
            )}
          </div>
        </td>
        <td data-label="Discount">
          {product.actualPrice > product.price ? (
            <span className="price-discount">{calculateDiscount(product.price, product.actualPrice)}% OFF</span>
          ) : (
            <span className="no-discount">—</span>
          )}
        </td>
        <td data-label="Stock">
          {hasVariants ? (
            <div className="stock-badge variant-stock">
              <i className="bi bi-boxes"></i> Varies by variant
            </div>
          ) : (
            <>
              <div className={`stock-badge ${availableStock <= 0 ? 'out-of-stock' : availableStock <= 10 ? 'low-stock' : 'in-stock'}`}>
                <i className="bi bi-boxes"></i> {availableStock} {product.unit}
              </div>
              {productInCart && (
                <div className="cart-stock-info">
                  <i className="bi bi-info-circle"></i> {getCartQuantity(product.id)} in cart
                </div>
              )}
            </>
          )}
        </td>
        <td data-label="Variants">
          {hasVariants ? (
            <div className="variants-cell">
              <button 
                className="btn-view-variants"
                onClick={() => {
                  setSelectedProductForCart(product);
                  setShowAttributeModal(true);
                  setSelectedAttribute(null);
                  setQuantity(1);
                }}
              >
                <i className="bi bi-list-ul"></i> {product.attributes.length} Variant{product.attributes.length > 1 ? 's' : ''}
              </button>
              <div className="variant-quick-select">
                {product.attributes.slice(0, 1).map((attr) => {
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
                  <button className="variant-chip more" onClick={() => {
                    setSelectedProductForCart(product);
                    setShowAttributeModal(true);
                    setSelectedAttribute(null);
                    setQuantity(1);
                  }}>
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
              disabled={!hasVariants && availableStock <= 0}
            >
              {!hasVariants && availableStock <= 0 ? (
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

  return (
    <div className="cart-billing-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-receipt me-3"></i>
              Product Selection
            </h2>
            <div className="breadcrumbs">
              Products › {CATEGORY_MAPPING[activeCategory]?.displayName}
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{getLaxmiBookstoreCount()}</span>
              <span className="stat-labelR">Laxmi Bookstore</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{getSwasthikEnterprisesCount()}</span>
              <span className="stat-labelR">Swasthik Enterprises</span>
            </div>
          </div>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={activeCategory === "laxmi_bookstore" ? "active" : ""}
          onClick={() => {
            setActiveCategory("laxmi_bookstore");
            clearFilters();
          }}
        >
          <i className="bi bi-book"></i> Laxmi Bookstore
        </button>
        <button
          className={activeCategory === "swasthik_enterprises" ? "active" : ""}
          onClick={() => {
            setActiveCategory("swasthik_enterprises");
            clearFilters();
          }}
        >
          <i className="bi bi-building"></i> Swasthik Enterprises
        </button>
      </div>

      <div className="main-content">
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
                options={currentCategorySubcategories}
                value={selectedSubcategory}
                onChange={setSelectedSubcategory}
                placeholder="All Subcategories"
                isClearable
                styles={selectStyles}
                className="filter-select"
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
              <p>No products found in {CATEGORY_MAPPING[activeCategory]?.displayName}</p>
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
                    <th>Subcategory</th>
                    <th>Price</th>
                    <th>Discount</th>
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
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSelection;