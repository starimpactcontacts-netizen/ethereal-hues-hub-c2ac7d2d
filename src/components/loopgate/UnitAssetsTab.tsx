import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Plus, Trash2, Image, FileImage, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCrewEditorSystem, CrewAsset } from "@/hooks/useCrewEditorSystem";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UnitAssetsTabProps {
  crewId: string;
  isOfficer: boolean;
}

const ASSET_TYPES = [
  { id: "logo", label: "Logo", icon: "🎨" },
  { id: "pfp", label: "PFP", icon: "👤" },
  { id: "overlay", label: "Overlay", icon: "🖼️" },
  { id: "banner", label: "Banner", icon: "📸" },
];

export default function UnitAssetsTab({ crewId, isOfficer }: UnitAssetsTabProps) {
  const { assets, tiers, myEditorStatus, addAsset, deleteAsset } = useCrewEditorSystem(crewId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("logo");
  const [assetUrl, setAssetUrl] = useState("");
  const [minTierOrder, setMinTierOrder] = useState(0);

  const myTierOrder = myEditorStatus?.tier?.tier_order || 0;

  // Group assets by type
  const assetsByType = ASSET_TYPES.map((type) => ({
    ...type,
    assets: assets.filter((a) => a.asset_type === type.id),
  }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }

    setUploading(true);
    const fileName = `${crewId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("crew-assets")
      .upload(fileName, file);

    if (error) {
      toast.error("Failed to upload file");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("crew-assets")
      .getPublicUrl(fileName);

    setAssetUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleAddAsset = async () => {
    if (!assetName || !assetUrl) return;

    await addAsset({
      name: assetName,
      asset_type: assetType as CrewAsset["asset_type"],
      asset_url: assetUrl,
      min_tier_order: minTierOrder,
    });

    setShowAddModal(false);
    setAssetName("");
    setAssetUrl("");
    setMinTierOrder(0);
  };

  const canAccessAsset = (asset: CrewAsset) => {
    if (isOfficer) return true;
    return myTierOrder >= asset.min_tier_order;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Unit Assets</h3>
          <p className="text-sm text-muted-foreground">
            Logos, PFPs, and overlays for verified editors
          </p>
        </div>
        {isOfficer && (
          <Button onClick={() => setShowAddModal(true)} size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        )}
      </div>

      {/* Not an editor warning */}
      {!myEditorStatus && !isOfficer && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
          <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            Become a verified editor to access Unit assets
          </p>
        </div>
      )}

      {/* Assets by Type */}
      {assetsByType.map(({ id, label, icon, assets: typeAssets }) => {
        if (typeAssets.length === 0) return null;

        return (
          <div key={id}>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span>{icon}</span>
              {label}s
              <Badge variant="secondary" className="text-xs">
                {typeAssets.length}
              </Badge>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {typeAssets.map((asset, index) => {
                const hasAccess = canAccessAsset(asset);
                const requiredTier = tiers.find((t) => t.tier_order === asset.min_tier_order);

                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-card border border-border rounded-xl overflow-hidden relative ${
                      !hasAccess ? "opacity-50" : ""
                    }`}
                  >
                    {/* Image Preview */}
                    <div className="aspect-square bg-muted relative">
                      {hasAccess ? (
                        <img
                          src={asset.asset_url}
                          alt={asset.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Tier Badge */}
                      {asset.min_tier_order > 0 && requiredTier && (
                        <div
                          className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${requiredTier.color}20`,
                            color: requiredTier.color,
                          }}
                        >
                          {requiredTier.icon} {requiredTier.name}+
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{asset.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        {hasAccess ? (
                          <a
                            href={asset.asset_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Locked</span>
                        )}

                        {isOfficer && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                            onClick={() => deleteAsset(asset.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {assets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No assets uploaded yet</p>
          {isOfficer && (
            <p className="text-sm mt-1">Add logos and PFPs for your editors</p>
          )}
        </div>
      )}

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Add Asset</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Asset Name</label>
                  <Input
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g., Main Logo, Discord PFP"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <div className="flex gap-2">
                    {ASSET_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setAssetType(type.id)}
                        className={`flex-1 p-2 rounded-lg border text-center transition-all ${
                          assetType === type.id
                            ? "border-gold bg-gold/10"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <span className="text-lg">{type.icon}</span>
                        <p className="text-xs mt-1">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Minimum Tier Required
                  </label>
                  <select
                    value={minTierOrder}
                    onChange={(e) => setMinTierOrder(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2"
                  >
                    <option value={0}>All Editors</option>
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.tier_order}>
                        {tier.icon} {tier.name}+
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Upload Image</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {assetUrl ? (
                      <div className="space-y-2">
                        <img
                          src={assetUrl}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssetUrl("")}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleUpload}
                          disabled={uploading}
                        />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploading ? "Uploading..." : "Click to upload"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Or paste URL</label>
                  <Input
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddAsset}
                    disabled={!assetName || !assetUrl}
                    className="flex-1 bg-gold text-black hover:bg-gold/90"
                  >
                    Add Asset
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
