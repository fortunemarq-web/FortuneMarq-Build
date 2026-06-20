"use client";

import { useState } from "react";
import clsx from "clsx";
import { LayoutDashboard, ListTodo, Flag, FolderOpen, GitPullRequest, Settings, ArrowLeft, Calendar, Clock, Briefcase, Users, FileText } from "lucide-react";
import Link from "next/link";
import TaskManager from "./task-manager";
import DeliverableManager from "./deliverable-manager";
import ChangeRequestBoard from "./change-request-board";
import ActivityTimeline from "@/components/ActivityTimeline";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";

interface ProjectDashboardProps {
    project: any;
    tasks: any[];
    milestones: any[];
    deliverables: any[];
    changeRequests: any[];
    tasksError?: any;
    isClientView?: boolean;
    fileManager?: React.ReactNode;
}

export default function ProjectDashboard({
    project,
    tasks,
    milestones,
    deliverables,
    changeRequests,
    tasksError,
    isClientView = false,
    fileManager
}: ProjectDashboardProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'tasks', label: 'Tasks', icon: ListTodo },
        { id: 'deliverables', label: 'Deliverables', icon: FolderOpen },
        { id: 'changes', label: 'Change Requests', icon: GitPullRequest },
        ...(fileManager ? [{ id: 'files', label: 'Files', icon: FileText }] : []),
    ];

    // Helper Functions for Overview
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Not set";
        return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const clientName = Array.isArray(project.clients) ? project.clients[0]?.business_name : project.clients?.business_name || "Unknown Client";
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Every project status maps to one of the five tones — no per-status rainbow.
    const statusTones: Record<string, Tone> = {
        not_started: "neutral",
        in_progress: "brand",
        on_hold: "warning",
        completed: "info",
        cancelled: "danger"
    };

    return (
        <div className="min-h-full bg-canvas px-4 py-6">
            <div className="mx-auto max-w-6xl">
                {/* Header Section */}
                <div className="mb-6">
                    <Link href="/projects" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Projects</span>
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-display text-2xl font-semibold text-slate-900 md:text-3xl">{clientName}</h1>
                            <p className="mt-1 capitalize text-slate-500">{project.service_type?.replace(/_/g, ' ') || 'Project'}</p>
                        </div>
                        <Badge tone={statusTones[project.status] || "neutral"} size="md" className="self-start capitalize">
                            {project.status?.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex overflow-x-auto border-b border-line mb-6 no-scrollbar">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                                    activeTab === tab.id
                                        ? "border-brand-deep text-brand-deep"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                            {/* Project Info Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Card className="p-4">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs uppercase tracking-wider">
                                        <Calendar className="h-4 w-4" /> Start Date
                                    </div>
                                    <p className="font-semibold text-slate-900 tabular-nums">{formatDate(project.start_date)}</p>
                                </Card>
                                <Card className="p-4">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs uppercase tracking-wider">
                                        <Clock className="h-4 w-4" /> Deadline
                                    </div>
                                    <p className="font-semibold text-slate-900 tabular-nums">{formatDate(project.deadline)}</p>
                                </Card>
                                <Card className="p-4">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs uppercase tracking-wider">
                                        <Briefcase className="h-4 w-4" /> Progress
                                    </div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-slate-900 font-semibold tabular-nums">{progress}%</span>
                                        <span className="text-xs text-slate-500 tabular-nums">{completedTasks}/{totalTasks} tasks</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </Card>
                                <Card className="p-4">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs uppercase tracking-wider">
                                        <Users className="h-4 w-4" /> Client
                                    </div>
                                    <p className="font-semibold text-slate-900 truncate">{project.clients?.primary_email}</p>
                                </Card>
                            </div>

                            {/* Recent Activity */}
                            <Card className="p-6">
                                <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Recent Activity</h2>
                                <ActivityTimeline entityType="project" entityId={project.id} />
                            </Card>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <TaskManager initialTasks={tasks} projectId={project.id} tasksError={tasksError} />
                        </div>
                    )}



                    {activeTab === 'deliverables' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DeliverableManager projectId={project.id} initialDeliverables={deliverables} isClientView={isClientView} />
                        </div>
                    )}

                    {activeTab === 'changes' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ChangeRequestBoard projectId={project.id} initialRequests={changeRequests} isClientView={isClientView} />
                        </div>
                    )}

                    {activeTab === 'files' && fileManager && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {fileManager}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
