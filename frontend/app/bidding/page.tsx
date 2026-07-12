"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";

interface Project {
  id: number;
  title: string;
  client_name: string;
  location: string;
  budget_range: string;
  bids_count: number;
  status: string;
  created_at: string;
  description: string;
}

export default function BiddingFeed() {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("http://localhost:8000/api/bidding/projects/");
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-end border-b border-stone-200 pb-6">
          <div>
            <p className="text-orange-600 font-semibold tracking-widest uppercase text-sm mb-2">Open Tenders</p>
            <h1 className="font-serif text-4xl text-stone-900">Bidding Feed</h1>
            <p className="text-stone-500 mt-2">Discover open projects and submit your proposals.</p>
          </div>
          {user && (
             <Link href="/estimation" className="btn-secondary text-sm border-orange-200">
               Post New Project
             </Link>
          )}
        </header>

        {loading ? (
          <div className="text-center py-20 text-stone-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg mb-4">No open projects yet.</p>
            {user && (
              <Link href="/estimation" className="btn-primary text-sm">
                Be the first to post a project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="space-y-4 flex-1">
                  <div className="flex gap-3 items-center">
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase rounded-full">{project.status}</span>
                    <span className="text-stone-400 text-sm">{fmtDate(project.created_at)}</span>
                  </div>
                  <h2 className="font-serif text-2xl text-stone-900">{project.title}</h2>
                  <p className="text-stone-600 line-clamp-2">{project.description}</p>
                  <div className="flex gap-6 pt-2">
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                       <span className="text-orange-500">📍</span> {project.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                       <span className="text-orange-500">💰</span> {project.budget_range}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                       <span className="text-orange-500">🏷️</span> {project.bids_count} bids
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col justify-between items-end md:ml-4">
                   <Link href={`/bidding/${project.id}`} className="btn-primary text-sm whitespace-nowrap">
                     View & Bid
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}