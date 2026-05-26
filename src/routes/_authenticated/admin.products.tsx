import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListProducts,
  adminUpsertProduct,
  adminToggleStatus,
  adminDeleteProduct,
  adminUploadFile,
} from "@/lib/products.functions";
import { GARDENS, formatPrice, type Garden } from "@/lib/gardens";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminProducts,
});

type Product = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  long_description: string | null;
  benefits: string[] | null;
  format: string | null;
  target_audience: string | null;
  garden: Garden | null;
  price_cents: number;
  currency: string;
  is_free: boolean;
  requires_application: boolean;
  cover_image_url: string | null;
  download_path: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

function emptyProduct(): Product {
  return {
    id: "",
    slug: "",
    title: "",
    tagline: "",
    description: "",
    long_description: "",
    benefits: [],
    format: "",
    target_audience: "",
    garden: null,
    price_cents: 0,
    currency: "ZAR",
    is_free: false,
    requires_application: false,
    cover_image_url: "",
    download_path: "",
    status: "draft",
    sort_order: 0,
  };
}

function sanitizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}


function AdminProducts() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListProducts);
  const upsertFn = useServerFn(adminUpsertProduct);
  const statusFn = useServerFn(adminToggleStatus);
  const deleteFn = useServerFn(adminDeleteProduct);

  const list = useQuery({ queryKey: ["admin-products"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const products = (list.data?.products ?? []) as Product[];
  const filtered = useMemo(
    () =>
      products.filter((p) =>
        !search
          ? true
          : `${p.title} ${p.slug} ${p.tagline ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase()),
      ),
    [products, search],
  );

  const statusMut = useMutation({
    mutationFn: statusFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-24">
        <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">Admin</div>
        <div className="mt-4 flex items-end justify-between gap-6 flex-wrap">
          <h1 className="font-display text-5xl">Products</h1>
          <Button
            onClick={() => setEditing(emptyProduct())}
            className="bg-banana text-banana-foreground hover:bg-banana/90"
          >
            <Plus className="size-4 mr-2" /> New product
          </Button>
        </div>

        <div className="mt-8">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="mt-8 border border-border">
          <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/30 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Garden</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {list.isLoading && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">Loading…</div>
          )}
          {filtered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 gap-2 border-b border-border/60 px-4 py-3 text-sm items-center"
            >
              <div className="col-span-4">
                <Link
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  className="hover:text-banana"
                >
                  {p.title}
                </Link>
                <div className="font-mono text-[10px] text-muted-foreground">{p.slug}</div>
              </div>
              <div className="col-span-2 text-muted-foreground">
                {p.garden ? GARDENS[p.garden]?.name ?? p.garden : "—"}
              </div>
              <div className="col-span-2 text-right font-mono">
                {formatPrice(p.price_cents, p.currency, p.is_free)}
              </div>
              <div className="col-span-2">
                <select
                  value={p.status}
                  onChange={(e) =>
                    statusMut.mutate({
                      data: { id: p.id, status: e.target.value as Product["status"] },
                    })
                  }
                  className="h-7 border border-border bg-background px-2 text-xs"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                {p.status === "published" && (
                  <Badge variant="outline" className="ml-2 text-[10px] border-banana/40 text-banana">
                    LIVE
                  </Badge>
                )}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
                      deleteMut.mutate({ data: { id: p.id } });
                    }
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {!list.isLoading && filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No products yet.
            </div>
          )}
        </div>
      </section>

      {editing && (
        <EditDrawer
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-products"] });
            setEditing(null);
          }}
        />
      )}

      <SiteFooter />
    </div>
  );
}

function EditDrawer({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const upsertFn = useServerFn(adminUpsertProduct);

  const [p, setP] = useState<Product>(product);
  const [benefitsText, setBenefitsText] = useState(
    (product.benefits ?? []).join("\n"),
  );
  const [uploading, setUploading] = useState<"cover" | "file" | null>(null);
  const uploadFn = useServerFn(adminUploadFile);

  const mut = useMutation({
    mutationFn: upsertFn,
    onSuccess: () => {
      toast.success("Product saved");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function set<K extends keyof Product>(k: K, v: Product[K]) {
    setP((cur) => ({ ...cur, [k]: v }));
  }

  async function onCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Cover must be < 8MB");
    setUploading("cover");
    try {
      const base64 = await fileToBase64(f);
      const ext = f.name.split(".").pop() || "png";
      const path = `${p.slug || `tmp-${Date.now()}`}.${ext}`;
      const res = await uploadFn({
        data: { bucket: "product-covers", path, contentType: f.type || "image/png", base64 },
      });
      if (res.url) set("cover_image_url", res.url);
      toast.success("Cover uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function onPdfFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) return toast.error("File must be < 25MB");
    setUploading("file");
    try {
      const base64 = await fileToBase64(f);
      const ext = f.name.split(".").pop() || "pdf";
      const path = `${p.slug || `tmp-${Date.now()}`}.${ext}`;
      const res = await uploadFn({
        data: { bucket: "product-files", path, contentType: f.type || "application/pdf", base64 },
      });
      set("download_path", res.path);
      toast.success("File uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(null);
    }
  }

  function save() {
    const benefits = benefitsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    mut.mutate({
      data: {
        id: p.id || undefined,
        slug: p.slug.trim(),
        title: p.title.trim(),
        tagline: p.tagline?.trim() || null,
        description: p.description?.trim() || null,
        long_description: p.long_description?.trim() || null,
        benefits,
        format: p.format?.trim() || null,
        target_audience: p.target_audience?.trim() || null,
        garden: p.garden ?? null,
        price_cents: Number(p.price_cents) || 0,
        currency: p.currency || "ZAR",
        is_free: !!p.is_free,
        requires_application: !!p.requires_application,
        cover_image_url: p.cover_image_url?.trim() || null,
        download_path: p.download_path?.trim() || null,
        status: p.status,
        sort_order: Number(p.sort_order) || 0,
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-full overflow-y-auto bg-background border-l border-border p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs tracking-[0.25em] uppercase text-banana">
              {p.id ? "Edit" : "Create"}
            </div>
            <h2 className="mt-1 font-display text-3xl">{p.title || "Untitled product"}</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <div className="mt-8 grid gap-5">
          <Field label="Title">
            <Input value={p.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Slug">
            <Input
              value={p.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            />
          </Field>
          <Field label="Tagline">
            <Input value={p.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Short description">
            <textarea
              value={p.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Long sales copy (markdown supported)">
            <textarea
              value={p.long_description ?? ""}
              onChange={(e) => set("long_description", e.target.value)}
              rows={8}
              className="w-full border border-border bg-background px-3 py-2 text-sm font-mono"
            />
          </Field>
          <Field label="Benefits (one per line)">
            <textarea
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              rows={5}
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (cents)">
              <Input
                type="number"
                value={p.price_cents}
                onChange={(e) => set("price_cents", Number(e.target.value))}
              />
            </Field>
            <Field label="Currency">
              <Input value={p.currency} onChange={(e) => set("currency", e.target.value)} />
            </Field>
            <Field label="Format">
              <Input value={p.format ?? ""} onChange={(e) => set("format", e.target.value)} />
            </Field>
            <Field label="Target audience">
              <Input
                value={p.target_audience ?? ""}
                onChange={(e) => set("target_audience", e.target.value)}
              />
            </Field>
            <Field label="Garden">
              <select
                value={p.garden ?? ""}
                onChange={(e) => set("garden", (e.target.value || null) as Garden | null)}
                className="h-9 w-full border border-border bg-background px-3 text-sm"
              >
                <option value="">—</option>
                {Object.entries(GARDENS).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Sort order">
              <Input
                type="number"
                value={p.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </Field>
            <Field label="Status">
              <select
                value={p.status}
                onChange={(e) => set("status", e.target.value as Product["status"])}
                className="h-9 w-full border border-border bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Flags">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={p.is_free} onChange={(e) => set("is_free", e.target.checked)} />
                Free
              </label>
              <label className="flex items-center gap-2 text-sm mt-2">
                <input
                  type="checkbox"
                  checked={p.requires_application}
                  onChange={(e) => set("requires_application", e.target.checked)}
                />
                By application
              </label>
            </Field>
          </div>

          <Field label="Cover image URL">
            <Input
              value={p.cover_image_url ?? ""}
              onChange={(e) => set("cover_image_url", e.target.value)}
              placeholder="/product-covers/slug.png or full URL"
            />
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={onCoverFile}
                disabled={uploading === "cover"}
                className="block w-full text-xs file:mr-3 file:border-0 file:bg-banana file:text-banana-foreground file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:tracking-[0.18em] file:uppercase hover:file:bg-banana/90"
              />
              {uploading === "cover" && <span className="text-xs text-muted-foreground">Uploading…</span>}
            </div>
            {p.cover_image_url && (
              <img
                src={p.cover_image_url}
                alt=""
                className="mt-3 h-32 w-32 object-cover border border-border"
              />
            )}
          </Field>

          <Field label="Download file path (in product-files bucket)">
            <Input
              value={p.download_path ?? ""}
              onChange={(e) => set("download_path", e.target.value)}
              placeholder="e.g. influencers-code.pdf"
            />
            <div className="mt-2">
              <input
                type="file"
                accept=".pdf,.epub,.zip,.mp3,.mp4"
                onChange={onPdfFile}
                disabled={uploading === "file"}
                className="block w-full text-xs file:mr-3 file:border-0 file:bg-foreground file:text-background file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:tracking-[0.18em] file:uppercase hover:file:bg-foreground/90"
              />
              {uploading === "file" && <span className="text-xs text-muted-foreground">Uploading…</span>}
            </div>
          </Field>
        </div>

        <div className="mt-8 flex gap-3 sticky bottom-0 bg-background pt-4 border-t border-border">
          <Button
            onClick={save}
            disabled={mut.isPending || !p.title || !p.slug}
            className="bg-banana text-banana-foreground hover:bg-banana/90"
          >
            {mut.isPending ? "Saving…" : "Save product"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
