import { useState, useEffect } from "react";
import { ShoppingBag, Sparkles, Gift, Package, Coins, Check, Clock, X, Truck, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  item_type: 'cosmetic' | 'digital' | 'physical';
  price: number;
  image_url: string | null;
  is_active: boolean;
  stock: number | null;
}

interface Redemption {
  id: string;
  item_id: string;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  points_spent: number;
  created_at: string;
  admin_notes: string | null;
  shop_items: {
    name: string;
    item_type: string;
    image_url: string | null;
  };
}

const itemTypeIcons = {
  cosmetic: Sparkles,
  digital: Gift,
  physical: Package,
};

const itemTypeLabels = {
  cosmetic: 'Cosmetic',
  digital: 'Digital',
  physical: 'Physical',
};

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gold/20 text-gold', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-500/20 text-blue-400', icon: Check },
  fulfilled: { label: 'Fulfilled', color: 'bg-green-500/20 text-green-400', icon: Check },
  rejected: { label: 'Rejected', color: 'bg-destructive/20 text-destructive', icon: X },
};

export default function ShopPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    phone: '',
  });

  const spendableIndex = (profile as any)?.spendable_index || 0;

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch shop items
      const { data: itemsData } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      setItems((itemsData || []) as ShopItem[]);

      // Fetch user's redemptions
      if (user) {
        const { data: redemptionsData } = await supabase
          .from('redemptions')
          .select(`
            *,
            shop_items (name, item_type, image_url)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setRedemptions((redemptionsData || []) as Redemption[]);
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (!selectedItem || !user) return;

    if (spendableIndex < selectedItem.price) {
      toast.error('Not enough Index points!');
      return;
    }

    setPurchasing(true);
    try {
      // For physical items, require shipping info
      if (selectedItem.item_type === 'physical') {
        if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || !shippingInfo.country) {
          toast.error('Please fill in all shipping details');
          setPurchasing(false);
          return;
        }
      }

      // Spend the index points
      const { data: spendResult, error: spendError } = await supabase
        .rpc('spend_index', {
          p_user_id: user.id,
          p_amount: selectedItem.price,
        });

      if (spendError) throw spendError;
      if (!spendResult) {
        toast.error('Not enough Index points!');
        setPurchasing(false);
        return;
      }

      // Create redemption request
      const { error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
          user_id: user.id,
          item_id: selectedItem.id,
          points_spent: selectedItem.price,
          shipping_info: selectedItem.item_type === 'physical' ? shippingInfo : null,
        });

      if (redemptionError) throw redemptionError;

      toast.success(`🎉 ${selectedItem.name} requested! Awaiting approval.`);
      setSelectedItem(null);
      setShippingInfo({ name: '', address: '', city: '', country: '', phone: '' });
      refreshProfile();
      fetchData();
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast.error('Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  }

  const canAfford = (price: number) => spendableIndex >= price;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-gold/10 to-transparent border-b border-border/50 px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <ShoppingBag className="text-gold" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Shop</h1>
              <p className="text-xs text-muted-foreground">Spend your Index</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-1 border border-border rounded-xl px-4 py-2">
            <Coins className="text-gold" size={18} />
            <span className="font-bold text-gold">{spendableIndex}</span>
            <span className="text-xs text-muted-foreground">INDEX</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Earn Index by competing in events. The higher your QOI score, the more you earn!
        </p>
      </div>

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none px-4 gap-4">
          <TabsTrigger value="shop" className="data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">
            Shop
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none bg-transparent">
            My Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-muted-foreground">No items available yet</p>
              <p className="text-sm text-muted-foreground/70">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => {
                const Icon = itemTypeIcons[item.item_type];
                const affordable = canAfford(item.price);
                const outOfStock = item.stock !== null && item.stock <= 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => !outOfStock && setSelectedItem(item)}
                    disabled={outOfStock}
                    className={`relative bg-surface-1 border border-border rounded-xl p-3 text-left transition-all ${
                      outOfStock ? 'opacity-50' : affordable ? 'hover:border-gold/50' : 'opacity-70'
                    }`}
                  >
                    {/* Image or Icon */}
                    <div className="aspect-square rounded-lg bg-surface-2 flex items-center justify-center mb-3 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="text-muted-foreground" size={32} />
                      )}
                    </div>

                    {/* Type Badge */}
                    <div className="flex items-center gap-1 mb-1">
                      <Icon size={12} className="text-muted-foreground" />
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {itemTypeLabels[item.item_type]}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="font-medium text-sm text-foreground truncate">{item.name}</h3>

                    {/* Price */}
                    <div className="flex items-center gap-1 mt-2">
                      <Coins className="text-gold" size={14} />
                      <span className={`font-bold ${affordable ? 'text-gold' : 'text-muted-foreground'}`}>
                        {item.price}
                      </span>
                    </div>

                    {/* Stock indicator */}
                    {item.stock !== null && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {item.stock} left
                      </p>
                    )}

                    {outOfStock && (
                      <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">Sold Out</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="px-4 py-4">
          {redemptions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground/70">Your purchases will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {redemptions.map((redemption) => {
                const config = statusConfig[redemption.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={redemption.id}
                    className="bg-surface-1 border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-2 flex items-center justify-center overflow-hidden">
                        {redemption.shop_items.image_url ? (
                          <img 
                            src={redemption.shop_items.image_url} 
                            alt={redemption.shop_items.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Package className="text-muted-foreground" size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {redemption.shop_items.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                            <StatusIcon size={10} />
                            {config.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(redemption.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-gold">
                          <Coins size={14} />
                          <span className="font-bold">{redemption.points_spent}</span>
                        </div>
                      </div>
                    </div>
                    {redemption.admin_notes && (
                      <p className="mt-3 text-sm text-muted-foreground bg-surface-2 rounded-lg p-2">
                        {redemption.admin_notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-surface-2 flex items-center justify-center overflow-hidden">
                  {selectedItem.image_url ? (
                    <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                  ) : (
                    (() => {
                      const Icon = itemTypeIcons[selectedItem.item_type];
                      return <Icon className="text-muted-foreground" size={24} />;
                    })()
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
              </div>

              <div className="bg-surface-2 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <div className="flex items-center gap-1 text-gold">
                    <Coins size={16} />
                    <span className="font-bold">{selectedItem.price}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className={canAfford(selectedItem.price) ? 'text-green-400' : 'text-destructive'}>
                    {spendableIndex} INDEX
                  </span>
                </div>
                <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">After Purchase</span>
                  <span className="font-bold text-foreground">
                    {spendableIndex - selectedItem.price} INDEX
                  </span>
                </div>
              </div>

              {/* Shipping info for physical items */}
              {selectedItem.item_type === 'physical' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck size={16} />
                    <span>Shipping Information Required</span>
                  </div>
                  <Input
                    placeholder="Full Name"
                    value={shippingInfo.name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                  />
                  <Textarea
                    placeholder="Address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    />
                    <Input
                      placeholder="Country"
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Phone (optional)"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                  />
                </div>
              )}

              <Button
                onClick={handlePurchase}
                disabled={!canAfford(selectedItem.price) || purchasing}
                className="w-full bg-gold hover:bg-gold/90 text-background"
              >
                {purchasing ? (
                  <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : canAfford(selectedItem.price) ? (
                  'Confirm Purchase'
                ) : (
                  'Not Enough INDEX'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
