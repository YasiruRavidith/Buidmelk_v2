"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
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

      const res = await fetch("http://localhost:8000/api/marketplace/assistant/", {
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
      const res = await fetch("http://localhost:8000/api/marketplace/cart/add/", {
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
        const res = await fetch("http://localhost:8000/api/marketplace/cart/add/", {
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
            className="group relative flex items-center gap-3 bg-gradient-to-r from-[#8B4434] via-[#6f3829] to-[#1c1108] text-[#FCFAF7] px-5 py-3.5 shadow-2xl hover:shadow-[0_8px_30px_rgba(139,68,52,0.4)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border border-[#FCFAF7]/20"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#1c1108]" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-200">AI Assistant</p>
              
            </div>
            <span className="bg-white/10 text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold rounded-none ml-1">
              Ask AI
            </span>
          </button>
        )}
      </div>

      {/* ── CHAT POPUP WIDGET ── */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[440px] max-w-[95vw] h-[620px] max-h-[85vh] z-50 bg-[#FCFAF7] border border-[#322318] shadow-[0_20px_50px_rgba(28,17,8,0.3)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">

          {/* Header */}
          <div className="bg-[#1c1108] text-[#FCFAF7] px-5 py-4 flex items-center justify-between border-b border-[#322318]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#8B4434] to-[#6f3829] border border-amber-300/30 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h3 className="font-serif text-base text-[#FCFAF7] font-semibold flex items-center gap-2">
                  BuildMe AI Assistant
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 font-sans font-bold uppercase tracking-wider">
                    Free
                  </span>
                </h3>
                <p className="text-[10px] text-[#c9b8b0] tracking-wide">Database &amp; Material Buying Advisor</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-[#c9b8b0] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="bg-[#1c1108]/95 px-4 py-2.5 flex items-center gap-2 overflow-x-auto border-b border-[#322318] scrollbar-none text-[10px]">
            <button
              onClick={() => handleSendMessage("Calculate bricks and cement for 1000 sqft house")}
              className="shrink-0 bg-[#8B4434]/30 hover:bg-[#8B4434] text-amber-100 border border-[#8B4434]/40 px-3 py-1 transition-colors"
            >
              🧱 1000 sqft Materials
            </button>
            <button
              onClick={() => handleSendMessage("Bulk order cement, steel and sand")}
              className="shrink-0 bg-[#8B4434]/30 hover:bg-[#8B4434] text-amber-100 border border-[#8B4434]/40 px-3 py-1 transition-colors"
            >
              📦 Bulk Buying List
            </button>
            <button
              onClick={() => handleSendMessage("Search material prices in database")}
              className="shrink-0 bg-[#8B4434]/30 hover:bg-[#8B4434] text-amber-100 border border-[#8B4434]/40 px-3 py-1 transition-colors"
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
                      ? "bg-[#8B4434] text-white border border-[#6f3829]"
                      : "bg-white text-[#1c1108] border border-[#e8ddd6] shadow-sm"
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B4434] flex items-center gap-1">
                          <Package className="w-3 h-3" /> Recommended Marketplace Materials
                        </span>
                        <button
                          onClick={() => handleAddAllToCart(msg.recommendedMaterials!)}
                          disabled={addingAll}
                          className="text-[9px] bg-[#8B4434] text-white font-bold uppercase tracking-wider px-2.5 py-1 hover:bg-[#6f3829] disabled:opacity-50 transition-colors"
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
                              className="bg-[#FCFAF7] border border-[#e8ddd6] p-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs hover:border-[#8B4434]/40 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] bg-[#8B4434]/10 text-[#8B4434] font-bold uppercase tracking-wider px-1.5 py-0.5">
                                  {mat.category}
                                </span>
                                <h5 className="font-semibold text-xs text-[#1c1108] truncate mt-0.5">{mat.name}</h5>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#606060] mt-1">
                                  <span className="font-serif font-bold text-[#8B4434]">
                                    {fmt(mat.unit_price)} / {mat.unit}
                                  </span>
                                  <span className="text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 border border-emerald-200">
                                    {mat.bulk_label}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddToCart(mat)}
                                disabled={isAdded}
                                className={`shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-2 transition-colors ${
                                  isAdded
                                    ? "bg-emerald-700 text-white"
                                    : "bg-[#1c1108] text-[#FCFAF7] hover:bg-[#8B4434]"
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
              <div className="flex items-center gap-2 text-[#8B4434] bg-white border border-[#e8ddd6] p-3 max-w-[70%] text-xs font-serif italic">
                <div className="w-4 h-4 border-2 border-[#8B4434] border-t-transparent rounded-full animate-spin" />
                Analyzing material database &amp; calculations...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Load Estimation Quick Selector Drawer */}
          {showEstDropdown && (
            <div className="bg-white border-t border-[#e8ddd6] p-3 shadow-lg max-h-48 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#8B4434] border-b border-[#e8ddd6] pb-1">
                <span>Select Saved AI Estimation</span>
                <button onClick={() => setShowEstDropdown(false)} className="text-[#606060] hover:text-black">
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
                    className="w-full text-left p-2 bg-[#FCFAF7] border border-[#e8ddd6] hover:border-[#8B4434] transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#1c1108]">{est.title}</p>
                      <p className="text-[10px] text-[#908078]">
                        {est.sqft} sqft • {est.floors} floor(s) • {est.quality}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8B4434]" />
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
                className="p-2.5 bg-[#FCFAF7] border border-[#e8ddd6] hover:border-[#8B4434] text-[#8B4434] transition-colors shrink-0"
                title="Load AI Estimation Project"
              >
                <Calculator className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about materials or ask to calculate (e.g. 1200 sqft)..."
                className="flex-1 bg-[#FCFAF7] border border-[#e8ddd6] px-3 py-2.5 text-xs text-[#1c1108] placeholder-[#908078] focus:outline-none focus:border-[#8B4434]"
              />

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-[#8B4434] text-white p-2.5 hover:bg-[#6f3829] disabled:opacity-50 transition-colors shrink-0"
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
