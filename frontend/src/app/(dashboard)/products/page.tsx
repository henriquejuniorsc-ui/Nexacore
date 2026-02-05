"use client";

import { useState, useEffect } from "react";
import { 
  Package, Plus, Search, Filter, AlertTriangle, TrendingUp, 
  TrendingDown, MoreVertical, Edit, Trash2, Loader2, AlertCircle,
  X, Check, ArrowUpCircle, ArrowDownCircle, History, Box,
  DollarSign, BarChart3, PackageX, RefreshCw, ChevronDown,
  Minus, PackagePlus, PackageMinus, RotateCcw, Percent
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================
interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  unit: string;
  category: string | null;
  brand: string | null;
  professional: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  isLowStock: boolean;
  movementsCount: number;
  createdAt: string;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  unitCost: number | null;
  totalCost: number | null;
  createdAt: string;
}

interface Professional {
  id: string;
  name: string;
  specialty: string | null;
}

interface ProductStats {
  total: number;
  lowStock: number;
  totalValue: number;
}

// ==================== CONSTANTS ====================
const MOVEMENT_TYPES = {
  IN: { 
    label: "Entrada", 
    icon: ArrowUpCircle, 
    color: "text-success", 
    bgColor: "bg-success/20",
    description: "Adicionar ao estoque"
  },
  OUT: { 
    label: "Saída", 
    icon: ArrowDownCircle, 
    color: "text-warning", 
    bgColor: "bg-warning/20",
    description: "Retirar do estoque"
  },
  SALE: { 
    label: "Venda", 
    icon: DollarSign, 
    color: "text-brand-pink", 
    bgColor: "bg-brand-pink/20",
    description: "Venda de produto"
  },
  LOSS: { 
    label: "Perda", 
    icon: PackageX, 
    color: "text-error", 
    bgColor: "bg-error/20",
    description: "Perda ou vencimento"
  },
  ADJUST: { 
    label: "Ajuste", 
    icon: RefreshCw, 
    color: "text-trust", 
    bgColor: "bg-trust/20",
    description: "Ajuste de inventário"
  },
  RETURN: { 
    label: "Devolução", 
    icon: RotateCcw, 
    color: "text-cta", 
    bgColor: "bg-cta/20",
    description: "Devolução ao estoque"
  },
};

const UNIT_OPTIONS = [
  { value: "un", label: "Unidade" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "g", label: "Gramas (g)" },
  { value: "kg", label: "Quilogramas (kg)" },
  { value: "cx", label: "Caixa" },
  { value: "amp", label: "Ampola" },
  { value: "fr", label: "Frasco" },
];

// ==================== COMPONENT ====================
export default function ProductsPage() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [stats, setStats] = useState<ProductStats>({ total: 0, lowStock: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterProfessional, setFilterProfessional] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Product form state
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    description: "",
    sku: "",
    barcode: "",
    costPrice: 0,
    salePrice: 0,
    quantity: 0,
    minQuantity: 5,
    unit: "un",
    category: "",
    brand: "",
    professionalId: "",
  });
  
  // Stock movement form state
  const [stockForm, setStockForm] = useState({
    type: "IN",
    quantity: 1,
    reason: "",
    unitCost: 0,
  });

  // ==================== FETCH DATA ====================
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (filterLowStock) params.append("lowStock", "true");
      if (filterProfessional) params.append("professionalId", filterProfessional);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar produtos");
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      setStats(data.stats || { total: 0, lowStock: 0, totalValue: 0 });
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const response = await fetch("/api/professionals");
      if (response.ok) {
        const data = await response.json();
        setProfessionals(data.professionals || []);
      }
    } catch (err) {
      console.error("Error fetching professionals:", err);
    }
  };

  const fetchStockHistory = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/stock?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        setStockHistory(data.movements || []);
      }
    } catch (err) {
      console.error("Error fetching stock history:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchProfessionals();
  }, [filterLowStock, filterProfessional]);

  // ==================== ACTIONS ====================
  const handleSaveProduct = async () => {
    if (!productForm.name) {
      setError("Nome do produto é obrigatório");
      return;
    }

    try {
      setActionLoading(true);
      
      const isEditing = !!productForm.id;
      const url = "/api/products";
      const method = isEditing ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar produto");
      }
      
      setShowProductModal(false);
      resetProductForm();
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStockMovement = async () => {
    if (!selectedProduct || stockForm.quantity <= 0) {
      setError("Quantidade deve ser maior que zero");
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetch("/api/products/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: stockForm.type,
          quantity: stockForm.quantity,
          reason: stockForm.reason,
          unitCost: stockForm.unitCost || selectedProduct.costPrice,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao registrar movimentação");
      }
      
      setShowStockModal(false);
      resetStockForm();
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/products?id=${selectedProduct.id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir produto");
      }
      
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== HELPERS ====================
  const resetProductForm = () => {
    setProductForm({
      id: "",
      name: "",
      description: "",
      sku: "",
      barcode: "",
      costPrice: 0,
      salePrice: 0,
      quantity: 0,
      minQuantity: 5,
      unit: "un",
      category: "",
      brand: "",
      professionalId: "",
    });
  };

  const resetStockForm = () => {
    setStockForm({
      type: "IN",
      quantity: 1,
      reason: "",
      unitCost: 0,
    });
  };

  const openEditProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      quantity: product.quantity,
      minQuantity: product.minQuantity,
      unit: product.unit,
      category: product.category || "",
      brand: product.brand || "",
      professionalId: product.professional?.id || "",
    });
    setShowProductModal(true);
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockForm({
      type: "IN",
      quantity: 1,
      reason: "",
      unitCost: product.costPrice,
    });
    setShowStockModal(true);
  };

  const openHistoryModal = async (product: Product) => {
    setSelectedProduct(product);
    await fetchStockHistory(product.id);
    setShowHistoryModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMarginPercentage = (cost: number, sale: number) => {
    if (cost === 0) return 0;
    return ((sale - cost) / cost * 100).toFixed(1);
  };

  // ==================== FILTER ====================
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !filterCategory || product.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-pink mx-auto mb-4" />
          <p className="text-text-secondary">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">Produtos & Estoque</h1>
          <p className="text-text-secondary">Gerencie produtos e controle de estoque</p>
        </div>
        <button 
          onClick={() => {
            resetProductForm();
            setShowProductModal(true);
          }} 
          className="btn-cta"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-error/20 text-error flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-pink/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-brand-pink" />
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Total de Produtos</p>
              <p className="text-2xl font-bold text-text-primary font-mono">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Valor em Estoque</p>
              <p className="text-2xl font-bold text-success font-mono">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              stats.lowStock > 0 ? "bg-error/20" : "bg-trust/20"
            )}>
              <AlertTriangle className={cn(
                "w-6 h-6",
                stats.lowStock > 0 ? "text-error" : "text-trust"
              )} />
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Estoque Baixo</p>
              <p className={cn(
                "text-2xl font-bold font-mono",
                stats.lowStock > 0 ? "text-error" : "text-trust"
              )}>{stats.lowStock}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cta/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-cta" />
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Categorias</p>
              <p className="text-2xl font-bold text-cta font-mono">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar produto, SKU ou marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={cn(
              "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
              filterLowStock
                ? "border-error bg-error/20 text-error"
                : "border-white/10 text-text-secondary hover:border-white/20"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            Estoque Baixo
          </button>
          
          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field py-2.5 pr-10 min-w-[150px]"
            >
              <option value="">Todas Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat!}>{cat}</option>
              ))}
            </select>
          )}
          
          {professionals.length > 0 && (
            <select
              value={filterProfessional}
              onChange={(e) => setFilterProfessional(e.target.value)}
              className="input-field py-2.5 pr-10 min-w-[180px]"
            >
              <option value="">Todos Profissionais</option>
              {professionals.map((pro) => (
                <option key={pro.id} value={pro.id}>{pro.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-text-primary text-lg font-medium mb-2">Nenhum produto encontrado</h3>
          <p className="text-text-secondary mb-4">
            {searchQuery || filterLowStock || filterCategory || filterProfessional
              ? "Tente ajustar os filtros de busca"
              : "Adicione produtos para gerenciar seu estoque"
            }
          </p>
          <button 
            onClick={() => {
              resetProductForm();
              setShowProductModal(true);
            }} 
            className="btn-cta inline-flex"
          >
            <Plus className="w-5 h-5" /> Adicionar Produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className={cn(
                "glass-card p-5 hover:border-white/20 transition-all relative group",
                product.isLowStock && "border-error/30"
              )}
            >
              {/* Low Stock Badge */}
              {product.isLowStock && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-error text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Baixo
                </div>
              )}
              
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-gradient/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-brand-pink" />
                  </div>
                  <div>
                    <h3 className="text-text-primary font-medium line-clamp-1">{product.name}</h3>
                    <p className="text-text-tertiary text-sm">
                      {product.sku ? `SKU: ${product.sku}` : product.category || "Sem categoria"}
                    </p>
                  </div>
                </div>
                
                {/* Actions Menu */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openHistoryModal(product)}
                    className="p-1.5 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors"
                    title="Histórico"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditProduct(product)}
                    className="p-1.5 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-error/20 text-text-tertiary hover:text-error transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Stock Info */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-hover mb-4">
                <div>
                  <p className="text-text-tertiary text-xs mb-1">Estoque Atual</p>
                  <p className={cn(
                    "text-xl font-bold font-mono",
                    product.isLowStock ? "text-error" : "text-text-primary"
                  )}>
                    {product.quantity} <span className="text-sm font-normal text-text-tertiary">{product.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-text-tertiary text-xs mb-1">Mínimo</p>
                  <p className="text-xl font-bold font-mono text-text-secondary">
                    {product.minQuantity} <span className="text-sm font-normal text-text-tertiary">{product.unit}</span>
                  </p>
                </div>
              </div>
              
              {/* Prices */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-surface-hover/50">
                  <p className="text-text-tertiary text-xs">Custo</p>
                  <p className="text-text-secondary text-sm font-mono">{formatCurrency(product.costPrice)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-surface-hover/50">
                  <p className="text-text-tertiary text-xs">Venda</p>
                  <p className="text-success text-sm font-mono font-medium">{formatCurrency(product.salePrice)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-surface-hover/50">
                  <p className="text-text-tertiary text-xs">Margem</p>
                  <p className="text-cta text-sm font-mono font-medium">
                    {getMarginPercentage(product.costPrice, product.salePrice)}%
                  </p>
                </div>
              </div>
              
              {/* Professional Badge */}
              {product.professional && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-trust/10 text-trust text-sm mb-4">
                  <Box className="w-4 h-4" />
                  <span>{product.professional.name}</span>
                </div>
              )}
              
              {/* Brand */}
              {product.brand && (
                <div className="text-text-tertiary text-xs mb-4">
                  Marca: <span className="text-text-secondary">{product.brand}</span>
                </div>
              )}
              
              {/* Action Button */}
              <button
                onClick={() => openStockModal(product)}
                className="w-full btn-secondary py-2.5 justify-center"
              >
                <TrendingUp className="w-4 h-4" />
                Movimentar Estoque
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ==================== PRODUCT MODAL ==================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProductModal(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading text-text-primary">
                {productForm.id ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button onClick={() => setShowProductModal(false)} className="text-text-tertiary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-text-secondary text-sm mb-2">Nome do Produto *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Botox Allergan 100U"
                  className="input-field w-full"
                />
              </div>
              
              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-text-secondary text-sm mb-2">Descrição</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Descrição do produto..."
                  rows={2}
                  className="input-field w-full resize-none"
                />
              </div>
              
              {/* SKU */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">SKU / Código</label>
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  placeholder="Ex: BOT-100"
                  className="input-field w-full"
                />
              </div>
              
              {/* Código de Barras */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">Código de Barras</label>
                <input
                  type="text"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  placeholder="Ex: 7891234567890"
                  className="input-field w-full"
                />
              </div>
              
              {/* Categoria */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">Categoria</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="Ex: Toxina Botulínica"
                  className="input-field w-full"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat!} />
                  ))}
                </datalist>
              </div>
              
              {/* Marca */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">Marca</label>
                <input
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  placeholder="Ex: Allergan"
                  className="input-field w-full"
                />
              </div>
              
              {/* Preço de Custo */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">Preço de Custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.costPrice}
                  onChange={(e) => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                  className="input-field w-full"
                />
              </div>
              
              {/* Preço de Venda */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.salePrice}
                  onChange={(e) => setProductForm({ ...productForm, salePrice: parseFloat(e.target.value) || 0 })}
                  className="input-field w-full"
                />
              </div>
              
              {/* Unidade */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">Unidade de Medida</label>
                <select
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  className="input-field w-full"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Quantidade Mínima */}
              <div>
                <label className="block text-text-secondary text-sm mb-2">Estoque Mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.minQuantity}
                  onChange={(e) => setProductForm({ ...productForm, minQuantity: parseInt(e.target.value) || 0 })}
                  className="input-field w-full"
                />
              </div>
              
              {/* Quantidade Inicial (apenas para novo produto) */}
              {!productForm.id && (
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Quantidade Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 0 })}
                    className="input-field w-full"
                  />
                </div>
              )}
              
              {/* Profissional */}
              {professionals.length > 0 && (
                <div className={productForm.id ? "" : "md:col-span-1"}>
                  <label className="block text-text-secondary text-sm mb-2">Vincular a Profissional</label>
                  <select
                    value={productForm.professionalId}
                    onChange={(e) => setProductForm({ ...productForm, professionalId: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Nenhum (produto geral)</option>
                    {professionals.map((pro) => (
                      <option key={pro.id} value={pro.id}>{pro.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Margin Preview */}
            {productForm.costPrice > 0 && productForm.salePrice > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-surface-hover flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Percent className="w-4 h-4" />
                  <span>Margem de Lucro</span>
                </div>
                <span className={cn(
                  "text-xl font-bold font-mono",
                  Number(getMarginPercentage(productForm.costPrice, productForm.salePrice)) >= 0 
                    ? "text-success" 
                    : "text-error"
                )}>
                  {getMarginPercentage(productForm.costPrice, productForm.salePrice)}%
                </span>
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowProductModal(false)} className="btn-secondary flex-1 py-3">
                Cancelar
              </button>
              <button 
                onClick={handleSaveProduct}
                disabled={actionLoading || !productForm.name}
                className="btn-cta flex-1 py-3 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {productForm.id ? "Salvar Alterações" : "Criar Produto"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STOCK MOVEMENT MODAL ==================== */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStockModal(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading text-text-primary">Movimentar Estoque</h2>
              <button onClick={() => setShowStockModal(false)} className="text-text-tertiary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Product Info */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-hover mb-6">
              <div className="w-12 h-12 rounded-xl bg-brand-gradient/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-brand-pink" />
              </div>
              <div>
                <h3 className="text-text-primary font-medium">{selectedProduct.name}</h3>
                <p className="text-text-tertiary text-sm">
                  Estoque atual: <span className="text-text-primary font-mono">{selectedProduct.quantity} {selectedProduct.unit}</span>
                </p>
              </div>
            </div>
            
            {/* Movement Type */}
            <div className="mb-4">
              <label className="block text-text-secondary text-sm mb-2">Tipo de Movimentação</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MOVEMENT_TYPES).slice(0, 4).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = stockForm.type === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setStockForm({ ...stockForm, type: key })}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        isSelected 
                          ? `border-brand-pink ${config.bgColor}` 
                          : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-4 h-4", config.color)} />
                        <span className="text-text-primary text-sm font-medium">{config.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-text-secondary text-sm mb-2">Quantidade</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStockForm({ ...stockForm, quantity: Math.max(1, stockForm.quantity - 1) })}
                  className="p-3 rounded-lg border border-white/10 hover:border-white/20 text-text-primary"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 1 })}
                  className="input-field w-full text-center text-xl font-mono"
                />
                <button
                  onClick={() => setStockForm({ ...stockForm, quantity: stockForm.quantity + 1 })}
                  className="p-3 rounded-lg border border-white/10 hover:border-white/20 text-text-primary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Unit Cost (for IN/RETURN) */}
            {(stockForm.type === "IN" || stockForm.type === "RETURN") && (
              <div className="mb-4">
                <label className="block text-text-secondary text-sm mb-2">Custo Unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={stockForm.unitCost}
                  onChange={(e) => setStockForm({ ...stockForm, unitCost: parseFloat(e.target.value) || 0 })}
                  className="input-field w-full"
                />
              </div>
            )}
            
            {/* Reason */}
            <div className="mb-6">
              <label className="block text-text-secondary text-sm mb-2">Motivo / Observação</label>
              <input
                type="text"
                value={stockForm.reason}
                onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                placeholder="Ex: Compra do fornecedor, uso em procedimento..."
                className="input-field w-full"
              />
            </div>
            
            {/* Preview */}
            <div className="p-4 rounded-lg bg-surface-hover mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Estoque após movimentação:</span>
                <span className={cn(
                  "font-bold font-mono text-lg",
                  ["IN", "RETURN"].includes(stockForm.type) ? "text-success" : "text-warning"
                )}>
                  {["IN", "RETURN"].includes(stockForm.type)
                    ? selectedProduct.quantity + stockForm.quantity
                    : Math.max(0, selectedProduct.quantity - stockForm.quantity)
                  } {selectedProduct.unit}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowStockModal(false)} className="btn-secondary flex-1 py-3">
                Cancelar
              </button>
              <button 
                onClick={handleStockMovement}
                disabled={actionLoading || stockForm.quantity <= 0}
                className="btn-cta flex-1 py-3 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== HISTORY MODAL ==================== */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading text-text-primary">Histórico de Movimentações</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-text-tertiary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Product Info */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-hover mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-brand-pink" />
              </div>
              <div>
                <h3 className="text-text-primary font-medium">{selectedProduct.name}</h3>
                <p className="text-text-tertiary text-sm">
                  Estoque atual: <span className="text-text-primary font-mono">{selectedProduct.quantity} {selectedProduct.unit}</span>
                </p>
              </div>
            </div>
            
            {/* History List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {stockHistory.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma movimentação registrada</p>
                </div>
              ) : (
                stockHistory.map((movement) => {
                  const config = MOVEMENT_TYPES[movement.type as keyof typeof MOVEMENT_TYPES];
                  const Icon = config?.icon || Package;
                  const isAddition = ["IN", "RETURN"].includes(movement.type);
                  
                  return (
                    <div key={movement.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover/50">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config?.bgColor)}>
                        <Icon className={cn("w-5 h-5", config?.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-text-primary font-medium">{config?.label || movement.type}</span>
                          <span className={cn(
                            "font-mono font-bold",
                            isAddition ? "text-success" : "text-error"
                          )}>
                            {isAddition ? "+" : "-"}{movement.quantity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-tertiary">
                          <span className="truncate">{movement.reason || "Sem observação"}</span>
                          <span className="flex-shrink-0 ml-2">{formatDate(movement.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-6">
              <button onClick={() => setShowHistoryModal(false)} className="btn-secondary w-full py-3">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-surface border border-white/10 rounded-xl w-full max-w-md p-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-heading text-text-primary mb-2">Excluir Produto?</h3>
              <p className="text-text-secondary mb-6">
                Tem certeza que deseja excluir <strong>{selectedProduct.name}</strong>? 
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="btn-secondary flex-1 py-3"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteProduct}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-lg bg-error text-white font-medium hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Excluir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}