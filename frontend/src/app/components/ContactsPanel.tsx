import { useCallback, useEffect, useState } from "react";
import { Phone, MapPin, Plus, Clock, Trash2, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import { contactsApi } from "../api/api";

interface ApiContact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relationship_type: string | null;
  priority: number;
  notify_on_sos: boolean;
}

const AVATAR_COLORS = ["#f43f5e", "#a855f7", "#6366f1", "#10b981", "#f59e0b", "#c94076"];

function colorFor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function ContactsPanel() {
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [checkInTimer, setCheckInTimer] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  const loadContacts = useCallback(() => {
    setLoading(true);
    setError(null);
    contactsApi
      .list()
      .then((res: any) => setContacts(Array.isArray(res) ? res : res?.contacts ?? []))
      .catch((e: any) => setError(e?.message ?? "Couldn't load contacts."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const resetForm = () => {
    setName(""); setPhone(""); setEmail(""); setRelationship(""); setFormError(null);
  };

  const handleAdd = async () => {
    if (name.trim().length < 1 || phone.trim().length < 7) {
      setFormError("Enter a name and a valid phone number.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await contactsApi.add({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        relationship_type: relationship.trim() || undefined,
      });
      resetForm();
      setShowAdd(false);
      loadContacts();
    } catch (e: any) {
      setFormError(e?.message ?? "Failed to add contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await contactsApi.delete(id);
      setContacts((cs) => cs.filter((c) => c.id !== id));
    } catch {
      // leave the contact in place on failure
    } finally {
      setDeletingId(null);
    }
  };

  const startCheckIn = (mins: number) => {
    setCheckInTimer(mins);
    setTimerActive(true);
  };

  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-semibold">Trusted Circle</h2>
          <p className="text-muted-foreground text-xs mt-0.5">People who watch over you</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs px-3 py-2 rounded-full transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Check-in timer */}
      <div
        className="rounded-2xl p-4"
        style={{ background: timerActive ? "rgba(16,185,129,0.08)" : "rgba(124,58,237,0.06)", border: `1px solid ${timerActive ? "rgba(16,185,129,0.25)" : "rgba(124,58,237,0.18)"}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className={timerActive ? "text-emerald-400" : "text-primary"} />
          <span className="text-sm font-medium" style={{ color: timerActive ? "#10b981" : "#d8b4fe" }}>
            {timerActive ? `Check-in in ${checkInTimer} min — contacts notified` : "Set a Check-in Timer"}
          </span>
          {timerActive && (
            <button onClick={() => setTimerActive(false)} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          )}
        </div>
        {!timerActive && (
          <div className="flex gap-2">
            {[15, 30, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => startCheckIn(mins)}
                className="flex-1 py-2 rounded-xl bg-black/4 hover:bg-primary/15 hover:text-primary text-muted-foreground text-xs transition-all"
              >
                {mins}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="rounded-2xl p-4 overflow-hidden"
          style={{ background: "#ffffff", border: "1.5px solid rgba(28,15,24,0.09)", boxShadow: "0 2px 12px rgba(28,15,24,0.08)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-foreground text-sm font-bold">Add Trusted Contact</p>
            <button onClick={() => setShowAdd(false)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(28,15,24,0.06)" }}>
              <X size={13} className="text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-2 mb-3">
            <input className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(28,15,24,0.04)", border: "1px solid rgba(28,15,24,0.09)" }}
              placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(28,15,24,0.04)", border: "1px solid rgba(28,15,24,0.09)" }}
              placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            <input className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(28,15,24,0.04)", border: "1px solid rgba(28,15,24,0.09)" }}
              placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
            <input className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(28,15,24,0.04)", border: "1px solid rgba(28,15,24,0.09)" }}
              placeholder="Relationship (optional)" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </div>
          {formError && <p className="text-xs mb-2" style={{ color: "#dc2626" }}>{formError}</p>}
          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm text-white font-bold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #c94076, #a8305a)", boxShadow: "0 3px 12px rgba(201,64,118,0.3)", opacity: saving ? 0.7 : 1 }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Adding…" : "Add Contact"}
          </button>
        </motion.div>
      )}

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 size={20} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading contacts…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-8 gap-2">
          <p className="text-foreground font-bold text-sm">Couldn't load contacts</p>
          <p className="text-xs text-center text-muted-foreground">{error}</p>
          <button onClick={loadContacts} className="text-xs font-bold px-4 py-2 rounded-xl" style={{ background: "rgba(201,64,118,0.1)", color: "#c94076" }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {contacts.length === 0 && (
            <div className="flex flex-col items-center py-8 gap-2">
              <span className="text-3xl">👥</span>
              <p className="text-foreground font-bold text-sm">No trusted contacts yet</p>
              <p className="text-xs text-center text-muted-foreground">Add people who should be alerted in an emergency.</p>
            </div>
          )}
          {contacts.map((c) => {
            const color = colorFor(c.name);
            const initial = c.name.charAt(0).toUpperCase();
            return (
              <div key={c.id} className="rounded-2xl p-3.5" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${color}88, ${color}44)`, border: `2px solid ${color}55` }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-sm font-medium">{c.name}</span>
                      {c.notify_on_sos && (
                        <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          <MapPin size={9} /> SOS
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">{c.phone}</p>
                    {c.relationship_type && <p className="text-muted-foreground text-[11px] mt-0.5 capitalize">{c.relationship_type}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-full bg-black/4 hover:bg-emerald-500/15 flex items-center justify-center transition-colors group">
                      <Phone size={14} className="text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                    </a>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="w-8 h-8 rounded-full bg-black/4 hover:bg-rose-500/15 flex items-center justify-center transition-colors group"
                    >
                      {deletingId === c.id
                        ? <Loader2 size={14} className="animate-spin text-muted-foreground" />
                        : <Trash2 size={14} className="text-muted-foreground group-hover:text-rose-500 transition-colors" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
