"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../lib/api";
import {
  Sparkles,
  X,
  Send,
  ShoppingCart,
  Calculator,
  Bot,
  CheckCircle2,
  Package,
  ChevronDown,
  Layers,
  Building2,
  ArrowRight,
  Info
} from "lucide-react";

interface MaterialItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  unit: string;
  unit_price: number;
  suggested_quantity: number;
  bulk_label: string;
  total_price: number;
  image_url?: string | null;
}

interface EstimationInfo {
  id: number;
  title: string;
  sqft: number;
  floors: number;
  quality: string;
  total_cost: number;
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  recommendedMaterials?: MaterialItem[];
  estimationsAvailable?: EstimationInfo[];
  timestamp: string;
}

export default function AiAssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedEstimations, setSavedEstimations] = useState<EstimationInfo[]>([]);
  const [showEstDropdown, setShowEstDropdown] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<number, boolean>>({});
  const [addingAll, setAddingAll] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "👋 Hi! I am your **BuildMe.lk AI Material & Estimation Assistant**.\n\nI can help you calculate construction materials from your database, suggest bulk quantities (e.g., 1,000 clay bricks, 50 bags cement), and generate direct buying lists for your cart!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string, estimationId?: number) => {
    const text = textToSend || inputMessage;
    if (!text.trim() && !estimationId) return;

    const userMsgText = text || "Load Material List for Selected Estimation";
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setLoading(true);
    setShowEstDropdown(false);

    try {
      let token = "";
      if (user) {
        token = await user.getIdToken();
      }

      const res = await fetch(`${API_BASE_URL}/marketplace/assistant/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          token,
          estimation_id: estimationId
        })
      });

      if (res.ok) {
        const data = await res.json();

        if (data.estimations_available && data.estimations_available.length > 0) {
          setSavedEstimations(data.estimations_available);
        }

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply,
          recommendedMaterials: data.recommended_materials,
          estimationsAvailable: data.estimations_available,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: "Sorry, I ran into an issue connecting to the material database. Please try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (mat: MaterialItem) => {
    if (!user) {
      alert("Please log in to add materials to your cart.");
      return;
    }
    setAddedItemIds((prev) => ({ ...prev, [mat.id]: true }));
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/marketplace/cart/add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          product_type: "material",
          product_id: mat.id,
          quantity: mat.suggested_quantity
        })
      });
      if (res.ok) {
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || "Failed to add item to cart.");
        setAddedItemIds((prev) => ({ ...prev, [mat.id]: false }));
      }
    } catch (err) {
      console.error(err);
      setAddedItemIds((prev) => ({ ...prev, [mat.id]: false }));
    }
  };

  const handleAddAllToCart = async (materials: MaterialItem[]) => {
    if (!user) {
      alert("Please log in to add materials to your cart.");
      return;
    }
    setAddingAll(true);
    try {
      const token = await user.getIdToken();
      for (const mat of materials) {
        const res = await fetch(`${API_BASE_URL}/marketplace/cart/add/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            product_type: "material",
            product_id: mat.id,
            quantity: mat.suggested_quantity
          })
        });
        if (res.ok) {
          setAddedItemIds((prev) => ({ ...prev, [mat.id]: true }));
        }
      }
      window.dispatchEvent(new Event("cartUpdated"));
    } finally {
      setAddingAll(false);
    }
  };

  const fmt = (val: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(val);

  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Assistant"
            className="group relative flex items-center justify-center w-14 h-14 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-full shadow-2xl hover:shadow-[0_8px_30px_rgba(234,88,12,0.4)] transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#EA580C]" />
            </div>
          </button>
        )}
      </div>

      {/* ── CHAT POPUP WIDGET ── */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[440px] max-w-[95vw] h-[620px] max-h-[85vh] z-50 bg-[#FCFAF7] border border-[#322318] shadow-[0_20px_50px_rgba(28,17,8,0.3)] flex flex-col overflow-hidden rounded-3xl animate-in fade-in slide-in-from-bottom-5 duration-300">

          {/* Header */}
          <div className="bg-[#1c1108] text-[#FCFAF7] px-5 py-4 flex items-center justify-between border-b border-[#322318]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] border border-amber-300/30 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h3 className="font-serif text-base text-[#FCFAF7] font-semibold flex items-center gap-2">
                  BuildMe AI Assistant
                </h3>
                <p className="text-[10px] text-[#c9b8b0] tracking-wide">Database &amp; Material Buying Advisor</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-[#c9b8b0] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="bg-[#1c1108]/95 px-4 py-2.5 flex items-center gap-2 overflow-x-auto border-b border-[#322318] scrollbar-none text-[10px]">
            <button
              onClick={() => handleSendMessage("Calculate bricks and cement for 1000 sqft house")}
              className="shrink-0 bg-[#EA580C]/30 hover:bg-[#EA580C] text-amber-100 border border-[#EA580C]/40 px-3 py-1 rounded-full transition-colors"
            >
              🧱 1000 sqft Materials
            </button>
            <button
              onClick={() => handleSendMessage("Bulk order cement, steel and sand")}
              className="shrink-0 bg-[#EA580C]/30 hover:bg-[#EA580C] text-amber-100 border border-[#EA580C]/40 px-3 py-1 rounded-full transition-colors"
            >
              📦 Bulk Buying List
            </button>
            <button
              onClick={() => handleSendMessage("Search material prices in database")}
              className="shrink-0 bg-[#EA580C]/30 hover:bg-[#EA580C] text-amber-100 border border-[#EA580C]/40 px-3 py-1 rounded-full transition-colors"
            >
              💰 Price Database
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 ${
                    msg.sender === "user"
                      ? "bg-[#EA580C] text-white border border-[#C2410C] rounded-2xl rounded-tr-xs"
                      : "bg-white text-[#1c1108] border border-[#e8ddd6] shadow-sm rounded-2xl rounded-tl-xs"
                  }`}
                >
                  {/* Sender label */}
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-[9px] opacity-75 border-b border-current/10 pb-1">
                    <span className="font-bold uppercase tracking-wider">
                      {msg.sender === "user" ? "You" : "BuildMe AI"}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message body */}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Recommended Material Cards (Direct Add-to-Cart) */}
                  {msg.recommendedMaterials && msg.recommendedMaterials.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#e8ddd6] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA580C] flex items-center gap-1">
                          <Package className="w-3 h-3" /> Recommended Marketplace Materials
                        </span>
                        <button
                          onClick={() => handleAddAllToCart(msg.recommendedMaterials!)}
                          disabled={addingAll}
                          className="text-[9px] bg-[#EA580C] text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg hover:bg-[#C2410C] disabled:opacity-50 transition-colors"
                        >
                          {addingAll ? "Adding All..." : "+ Add All to Cart"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {msg.recommendedMaterials.map((mat) => {
                          const isAdded = addedItemIds[mat.id];
                          return (
                            <div
                              key={mat.id}
                              className="bg-[#FCFAF7] border border-[#e8ddd6] p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-2xs hover:border-[#EA580C]/40 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] bg-[#EA580C]/10 text-[#EA580C] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                  {mat.category}
                                </span>
                                <h5 className="font-semibold text-xs text-[#1c1108] truncate mt-0.5">{mat.name}</h5>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#606060] mt-1">
                                  <span className="font-serif font-bold text-[#EA580C]">
                                    {fmt(mat.unit_price)} / {mat.unit}
                                  </span>
                                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 border border-emerald-200 rounded-md">
                                    {mat.bulk_label}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddToCart(mat)}
                                disabled={isAdded}
                                className={`shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${
                                  isAdded
                                    ? "bg-emerald-700 text-white"
                                    : "bg-[#1c1108] text-[#FCFAF7] hover:bg-[#EA580C]"
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-200" /> Added
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-3 h-3" /> Add to Cart
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-[#EA580C] bg-white border border-[#e8ddd6] p-3 rounded-2xl max-w-[70%] text-xs font-serif italic">
                <div className="w-4 h-4 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin" />
                Analyzing material database &amp; calculations...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Load Estimation Quick Selector Drawer */}
          {showEstDropdown && (
            <div className="bg-white border-t border-[#e8ddd6] p-3 shadow-lg max-h-48 overflow-y-auto space-y-2 rounded-t-2xl">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#EA580C] border-b border-[#e8ddd6] pb-1">
                <span>Select Saved AI Estimation</span>
                <button onClick={() => setShowEstDropdown(false)} className="text-[#606060] hover:text-black p-1 rounded-full">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {savedEstimations.length === 0 ? (
                <p className="text-[10px] text-[#908078] py-2 text-center">
                  No saved estimations found. Create one in the Estimation page first!
                </p>
              ) : (
                savedEstimations.map((est) => (
                  <button
                    key={est.id}
                    onClick={() => handleSendMessage(`Load material list for estimation '${est.title}'`, est.id)}
                    className="w-full text-left p-2.5 bg-[#FCFAF7] border border-[#e8ddd6] hover:border-[#EA580C] rounded-xl transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#1c1108]">{est.title}</p>
                      <p className="text-[10px] text-[#908078]">
                        {est.sqft} sqft • {est.floors} floor(s) • {est.quality}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#EA580C]" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-[#e8ddd6]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Load Estimation Trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowEstDropdown(!showEstDropdown);
                  if (savedEstimations.length === 0) {
                    handleSendMessage("List my saved estimations");
                  }
                }}
                className="p-2.5 bg-[#FCFAF7] border border-[#e8ddd6] hover:border-[#EA580C] text-[#EA580C] rounded-xl transition-colors shrink-0"
                title="Load AI Estimation Project"
              >
                <Calculator className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about materials or ask to calculate (e.g. 1200 sqft)..."
                className="flex-1 bg-[#FCFAF7] border border-[#e8ddd6] px-3.5 py-2.5 text-xs text-[#1c1108] placeholder-[#908078] rounded-xl focus:outline-none focus:border-[#EA580C]"
              />

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-[#EA580C] text-white p-2.5 rounded-xl hover:bg-[#C2410C] disabled:opacity-50 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
