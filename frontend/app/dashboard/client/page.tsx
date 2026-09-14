"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Calculator, FolderKanban, Users, FileText, Download, Plus, 
  ArrowRight, Sparkles, Trash2, MessageSquare, ShieldCheck, Clock, UserCheck
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../../../hooks/useAuth";

type EstimationHistoryItem = {
  id: number;
  project_title: string;
  total_area_sqft: string;
  number_of_floors: number;
  number_of_rooms: number;
  quality_level: string;
  total_estimated_cost: string;
  created_at: string;
  pdf_url?: string;
};

type ChatConversation = {
  conversation_type?: string;
  unlock_id?: number;
  qs_id?: number;
  client_id?: number;
  chat_url?: string;
  project_id?: number | null;
  project_title: string;
  project_status: string;
  location: string;
  accepted_bid?: {
    id: number;
    bid_amount: string;
    estimated_days: number;
  };
  counterpart: {
    id: number;
    name: string;
    role: string;
    company_name: string;
    profile_image?: string | null;
  };
  last_message?: {
    id: number;
    message: string;
    sender_name: string;
    is_me: boolean;
    is_read: boolean;
    created_at: string;
  } | null;
  unread_count: number;
  last_activity_time: string;
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [history, setHistory] = useState<EstimationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Chat conversations state
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

  const handleDeleteEstimation = async (id: number) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this saved estimation?")) return;
    setDeletingId(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${backendUrl}/estimations/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Failed to delete estimation.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting estimation.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;

      setHistoryLoading(true);
      setHistoryError("");

      try {
        const token = await user.getIdToken();
        const response = await fetch(`${backendUrl}/estimations/history/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load estimation history");
        }

        setHistory(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Failed to load estimation history", error);
        setHistoryError("Unable to load estimation history right now.");
      } finally {
        setHistoryLoading(false);
      }
    };

    const loadChats = async () => {
      if (!user) return;
      setChatsLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${backendUrl}/bidding/chats/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setChats(data.conversations || []);
        }
      } catch (err) {
        console.error("Failed to load chats", err);
      } finally {
        setChatsLoading(false);
      }
    };

    loadHistory();
    loadChats();
  }, [backendUrl, user]);

  const navSections = [
    {
      title: "Account",
      items: [
        {
          label: "Overview",
          href: "/dashboard/client",
          description: "Project overview",
          isActive: pathname === "/dashboard/client",
        },
        {
          label: "Project Chats",
          href: "/dashboard/client#chats",
          description: "Contractor 1-on-1 rooms",
          isActive: pathname.includes("#chats"),
        },
        {
          label: "Public Profile",
          href: "/profile",
          description: "Your public profile",
          isActive: pathname === "/profile",
        },
        {
          label: "Pending Requests",
          href: "/dashboard/requests",
          description: "Open requests",
          isActive: pathname === "/dashboard/requests",
        },
        {
          label: "Profile Settings",
          href: "/settings",
          description: "Account preferences",
          isActive: pathname === "/settings",
        },
      ],
    },
    {
      title: "Estimations",
      items: [
        {
          label: "New Estimate",
          href: "/estimation",
          description: "Create a fresh estimation",
          isActive: pathname === "/estimation",
        },
        {
          label: "Estimation History",
          href: "/dashboard/client#estimation-history",
          description: "Download previous PDFs",
          isActive: pathname.includes("#estimation-history"),
        },
      ],
    },
  ];

  return (
    <DashboardShell navSections={navSections}>
      {/* Top Banner Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#efe6df]">
        <div>
          <p className="text-[#8B4434] font-semibold tracking-widest uppercase text-xs mb-1">
            Homeowner Workspace
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#281713]">
            Welcome, {user?.displayName || "Client"}
          </h1>
          <p className="text-xs text-[#606060] mt-1">
            Manage your construction estimates, active projects, and hired professionals.
          </p>
        </div>
        <Link
          href="/estimation"
          className="btn-primary flex items-center gap-2 text-xs uppercase tracking-wider py-3 px-5 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Project Estimate
        </Link>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[#efe6df] p-5 rounded-none shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B4434]/70">Estimations</span>
            <Calculator className="w-4 h-4 text-[#8B4434]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">
            {historyLoading ? "..." : history.length}
          </div>
          <p className="text-[11px] text-[#606060]">Calculated project reports</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-none shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B4434]/70">Project Chats</span>
            <MessageSquare className="w-4 h-4 text-[#8B4434]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#281713]">
              {chatsLoading ? "..." : chats.length}
            </span>
            {chats.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                {chats.reduce((acc, c) => acc + (c.unread_count || 0), 0)} new
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#606060]">Active contractor 1-on-1 rooms</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-none shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B4434]/70">Saved Contacts</span>
            <Users className="w-4 h-4 text-[#8B4434]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">0</div>
          <p className="text-[11px] text-[#606060]">Contractors & engineers</p>
        </div>

        <div className="bg-white border border-[#efe6df] p-5 rounded-none shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B4434]/70">Pending Tasks</span>
            <FileText className="w-4 h-4 text-[#8B4434]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#281713]">0</div>
          <p className="text-[11px] text-[#606060]">Inquiries awaiting review</p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <section className="bg-[#fcfaf9] border border-[#efe6df] p-6 rounded-none space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#281713]">Quick Actions</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/estimation"
            className="p-4 bg-white border border-[#efe6df] hover:border-[#8B4434] transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-semibold text-[#281713]">Create Estimation</div>
              <div className="text-[11px] text-[#606060] mt-0.5">Calculate costs by sqft</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B4434] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/professionals"
            className="p-4 bg-white border border-[#efe6df] hover:border-[#8B4434] transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-semibold text-[#281713]">Find Professionals</div>
              <div className="text-[11px] text-[#606060] mt-0.5">Contractors & QS Experts</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B4434] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/bidding"
            className="p-4 bg-white border border-[#efe6df] hover:border-[#8B4434] transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-semibold text-[#281713]">Post Project for Bids</div>
              <div className="text-[11px] text-[#606060] mt-0.5">Receive competitive quotes</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B4434] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Active Project Chats Section */}
      <section id="chats" className="bg-white border border-[#efe6df] rounded-none p-6 shadow-xs scroll-mt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#efe6df] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-widest text-[#8B4434]/70 font-semibold">Direct Communication</p>
              {chats.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {chats.reduce((acc, c) => acc + (c.unread_count || 0), 0)} Unread Message{chats.reduce((acc, c) => acc + (c.unread_count || 0), 0) !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl text-[#281713]">Active Project Chats</h2>
          </div>
          <p className="text-xs text-[#606060] max-w-sm">
            Chat 1-on-1 with contractors whose bids you've accepted for site planning, drawings, and milestones.
          </p>
        </div>

        {chatsLoading ? (
          <div className="py-8 text-center text-xs text-[#606060]">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-[#8B4434] border-t-transparent mb-2" />
            <p>Loading project conversations...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="rounded-none border border-dashed border-[#efe6df] p-8 text-center space-y-3 bg-[#FCFAF7]">
            <MessageSquare className="w-8 h-8 text-[#8B4434]/40 mx-auto" />
            <p className="text-sm font-serif text-[#281713]">No active project chats yet</p>
            <p className="text-xs text-[#606060] max-w-md mx-auto leading-relaxed">
              When you post a project tender and accept a contractor's proposal, your dedicated private chat room will appear here automatically.
            </p>
            <Link
              href="/bidding"
              className="btn-primary inline-flex items-center gap-2 text-xs px-5 py-2.5 mt-2 uppercase tracking-wider"
            >
              Go to Bidding Feed &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => {
              const counterpartInitials = chat.counterpart?.name
                ? chat.counterpart.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "CO";
              const lastMsgTime = chat.last_message?.created_at
                ? new Date(chat.last_message.created_at).toLocaleDateString("en-LK", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date(chat.last_activity_time).toLocaleDateString("en-LK", { month: "short", day: "numeric" });

              return (
                <div
                  key={chat.project_id ? `proj-${chat.project_id}` : `unlock-${chat.unlock_id}`}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border p-5 transition-all bg-[#FCFAF7] ${
                    chat.unread_count > 0 ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20" : "border-[#efe6df] hover:border-[#8B4434]/40"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Counterpart Avatar with Unread Badge */}
                    <div className="relative shrink-0 mt-0.5">
                      {chat.counterpart?.profile_image ? (
                        <img
                          src={chat.counterpart.profile_image}
                          alt={chat.counterpart.name}
                          className="w-12 h-12 object-cover border border-[#8B4434]/20"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#1c1108] text-[#FCFAF7] font-serif text-sm font-semibold flex items-center justify-center">
                          {counterpartInitials}
                        </div>
                      )}
                      {chat.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-base font-semibold text-[#281713]">
                          {chat.counterpart?.name}
                        </span>
                        {chat.counterpart?.company_name && (
                          <span className="text-[11px] text-[#606060]">
                            &bull; {chat.counterpart.company_name}
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold bg-stone-200 text-stone-700">
                          {chat.counterpart?.role || "CONTRACTOR"}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-[#8B4434] truncate">
                        {chat.project_title}
                        {chat.accepted_bid?.bid_amount && (
                          <span className="text-[#606060] font-normal ml-2">
                            (Awarded: LKR {Number(chat.accepted_bid.bid_amount).toLocaleString()})
                          </span>
                        )}
                      </p>

                      {/* Last Message Snippet */}
                      <p className="text-xs text-[#606060] line-clamp-1">
                        {chat.last_message ? (
                          <>
                            <span className="font-semibold text-stone-700">
                              {chat.last_message.is_me ? "You: " : `${chat.counterpart.name.split(" ")[0]}: `}
                            </span>
                            "{chat.last_message.message}"
                          </>
                        ) : (
                          <span className="italic text-stone-400">No messages yet. Click to begin conversation.</span>
                        )}
                      </p>

                      <p className="text-[10px] text-[#908078] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {lastMsgTime}
                      </p>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {chat.unread_count > 0 && (
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wider rounded-none">
                        {chat.unread_count} Unread
                      </span>
                    )}
                    <Link
                      href={chat.chat_url || (chat.qs_id ? `/professionals/${chat.qs_id}?chat=open` : `/bidding/${chat.project_id}?chat=open`)}
                      className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Open Chat
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Estimation History Table / List */}
      <section id="estimation-history" className="bg-white border border-[#efe6df] rounded-none p-6 shadow-xs scroll-mt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#efe6df] pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8B4434]/70 font-semibold">Saved Reports</p>
            <h2 className="font-serif text-2xl text-[#281713]">Estimation History</h2>
          </div>
          <p className="text-xs text-[#606060] max-w-sm">
            Open any saved estimate and download the official PDF report.
          </p>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-xs text-[#606060]">Loading estimation history...</div>
        ) : historyError ? (
          <div className="py-4 text-center text-xs text-red-600 font-medium">{historyError}</div>
        ) : history.length === 0 ? (
          <div className="rounded-none border border-dashed border-[#efe6df] p-10 text-center space-y-3">
            <Calculator className="w-8 h-8 text-[#8B4434]/40 mx-auto" />
            <p className="text-sm font-serif text-[#281713]">No estimations saved yet</p>
            <p className="text-xs text-[#606060] max-w-sm mx-auto">
              Use our smart cost estimation tool to estimate building costs for your land, floors, and rooms.
            </p>
            <Link
              href="/estimation"
              className="btn-primary inline-flex items-center gap-2 text-xs px-5 py-2.5 mt-2"
            >
              Start First Estimation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#efe6df] bg-[#fcfaf9] p-5 transition-colors hover:border-[#8B4434]/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-base font-semibold text-[#281713]">
                      {item.project_title}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-[#8B4434]/10 text-[#8B4434]">
                      {item.quality_level}
                    </span>
                  </div>
                  <p className="text-xs text-[#606060]">
                    {item.total_area_sqft} sqft · {item.number_of_floors} floors · {item.number_of_rooms} rooms
                  </p>
                  <p className="text-xs font-semibold text-[#8B4434]">
                    LKR {Number(item.total_estimated_cost).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`${backendUrl.replace("/api", "")}${item.pdf_url || `/api/estimations/${item.id}/pdf/`}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteEstimation(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2.5 text-[#8B4434] hover:bg-rose-50 border border-[#efe6df] hover:border-rose-200 transition-colors disabled:opacity-50"
                    title="Delete estimation"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}