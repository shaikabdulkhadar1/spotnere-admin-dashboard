import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Plus,
  Tag,
  Percent,
  Calendar,
  X,
  Pencil,
  Trash2,
  Gift,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type DiscountType = "percentage" | "fixed";
type PromotionStatus = "active" | "expired" | "scheduled";

interface Promotion {
  id: string;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  applicableTo: "all" | "specific";
  placeIds?: string[];
  status: PromotionStatus;
  created_at?: string;
}

// Mock data for design - replace with API fetch
const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: "1",
    code: "SUMMER20",
    name: "Summer Sale",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 500,
    maxUses: 100,
    usedCount: 34,
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    applicableTo: "all",
    status: "active",
  },
  {
    id: "2",
    code: "FLAT500",
    name: "Flat ₹500 Off",
    discountType: "fixed",
    discountValue: 500,
    minOrderAmount: 2000,
    maxUses: 50,
    usedCount: 50,
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    applicableTo: "all",
    status: "expired",
  },
  {
    id: "3",
    code: "WELCOME10",
    name: "New Customer Discount",
    discountType: "percentage",
    discountValue: 10,
    maxUses: 200,
    usedCount: 12,
    startDate: "2025-02-15",
    endDate: "2025-12-31",
    applicableTo: "all",
    status: "active",
  },
];

const ITEMS_PER_PAGE = 10;

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusBadge(status: PromotionStatus) {
  const variants: Record<PromotionStatus, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    scheduled: "secondary",
    expired: "destructive",
  };
  return <Badge variant={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function getDiscountDisplay(p: Promotion): string {
  if (p.discountType === "percentage") {
    return `${p.discountValue}% off`;
  }
  return `${formatCurrency(p.discountValue)} off`;
}

export default function Promotions() {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>(MOCK_PROMOTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesType = typeFilter === "all" || p.discountType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [promotions, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredPromotions.length / ITEMS_PER_PAGE);
  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPromotions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPromotions, currentPage]);

  const stats = useMemo(() => {
    const active = promotions.filter((p) => p.status === "active").length;
    const totalRedemptions = promotions.reduce((sum, p) => sum + p.usedCount, 0);
    const expired = promotions.filter((p) => p.status === "expired").length;
    return { active, totalRedemptions, expired };
  }, [promotions]);

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || typeFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  const handleSavePromotion = (data: Omit<Promotion, "id" | "usedCount">) => {
    if (editingPromotion) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === editingPromotion.id
            ? { ...p, ...data, usedCount: editingPromotion.usedCount }
            : p
        )
      );
      toast({ title: "Promotion updated successfully" });
      setEditingPromotion(null);
    } else {
      const newPromo: Promotion = {
        ...data,
        id: crypto.randomUUID(),
        usedCount: 0,
      };
      setPromotions((prev) => [newPromo, ...prev]);
      toast({ title: "Promotion created successfully" });
      setIsCreateOpen(false);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setPromotions((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast({ title: "Promotion deleted", variant: "destructive" });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promotions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage discount codes and promotional offers
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Promotion
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Promotions
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Redemptions
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.expired}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Discount Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Showing {paginatedPromotions.length} of {filteredPromotions.length} promotions
          {hasActiveFilters && " (filtered)"}
        </p>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No promotions yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create your first promotion to offer discounts to customers.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Promotion
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPromotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {promo.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{promo.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        {promo.discountType === "percentage" ? (
                          <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : null}
                        {getDiscountDisplay(promo)}
                        {promo.minOrderAmount ? (
                          <span className="text-muted-foreground text-xs">
                            (min {formatCurrency(promo.minOrderAmount)})
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {promo.usedCount} / {promo.maxUses}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                    </TableCell>
                    <TableCell>{getStatusBadge(promo.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPromotion(promo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(promo)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="border-t border-border p-4">
            <Pagination>
              <PaginationContent>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <PromotionFormDialog
        open={isCreateOpen || !!editingPromotion}
        promotion={editingPromotion}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingPromotion(null);
        }}
        onSave={handleSavePromotion}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the promotion{" "}
              <strong>{deleteTarget?.code}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PromotionFormDialogProps {
  open: boolean;
  promotion: Promotion | null;
  onClose: () => void;
  onSave: (data: Omit<Promotion, "id" | "usedCount">) => void;
}

function PromotionFormDialog({
  open,
  promotion,
  onClose,
  onSave,
}: PromotionFormDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isEdit = !!promotion;

  useEffect(() => {
    if (open) {
      if (promotion) {
        setCode(promotion.code);
        setName(promotion.name);
        setDiscountType(promotion.discountType);
        setDiscountValue(String(promotion.discountValue));
        setMinOrderAmount(promotion.minOrderAmount ? String(promotion.minOrderAmount) : "");
        setMaxUses(String(promotion.maxUses));
        setStartDate(promotion.startDate);
        setEndDate(promotion.endDate);
      } else {
        setCode("");
        setName("");
        setDiscountType("percentage");
        setDiscountValue("");
        setMinOrderAmount("");
        setMaxUses("");
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate(
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        );
      }
    }
  }, [open, promotion]);

  const resetForm = () => {
    if (promotion) {
      setCode(promotion.code);
      setName(promotion.name);
      setDiscountType(promotion.discountType);
      setDiscountValue(String(promotion.discountValue));
      setMinOrderAmount(promotion.minOrderAmount ? String(promotion.minOrderAmount) : "");
      setMaxUses(String(promotion.maxUses));
      setStartDate(promotion.startDate);
      setEndDate(promotion.endDate);
    } else {
      setCode("");
      setName("");
      setDiscountType("percentage");
      setDiscountValue("");
      setMinOrderAmount("");
      setMaxUses("");
      setStartDate("");
      setEndDate("");
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
      resetForm();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(discountValue);
    const max = Number(maxUses);
    const minOrder = minOrderAmount ? Number(minOrderAmount) : undefined;
    if (!code.trim() || !name.trim() || isNaN(value) || value <= 0 || isNaN(max) || max <= 0) {
      return;
    }
    if (discountType === "percentage" && value > 100) return;
    const start = startDate || new Date().toISOString().split("T")[0];
    const end =
      endDate ||
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const now = new Date();
    let status: PromotionStatus = "active";
    if (new Date(end) < now) status = "expired";
    else if (new Date(start) > now) status = "scheduled";

    onSave({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      discountType,
      discountValue: value,
      minOrderAmount: minOrder,
      maxUses: max,
      startDate: start,
      endDate: end,
      applicableTo: "all",
      status,
    });
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Promotion" : "Create Promotion"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUMMER20"
                disabled={isEdit}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Summer Sale"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={discountType}
                onValueChange={(v) => setDiscountType(v as DiscountType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">
                Value {discountType === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="value"
                type="number"
                min={discountType === "percentage" ? 1 : 1}
                max={discountType === "percentage" ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "20" : "500"}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOrder">Min Order (₹)</Label>
              <Input
                id="minOrder"
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="100"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Save Changes" : "Create Promotion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
