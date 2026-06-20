"use client";

import { ListTodo, CheckCircle2, Trophy } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import MemberMenu from "@/components/team/member-menu";

interface TeamMemberCardProps {
  profile: any;
  stats: {
    active: number;
    completedToday: number;
    completedThisWeek: number;
  };
  onAssign?: () => void;
}

export default function TeamMemberCard({ profile, stats, onAssign }: TeamMemberCardProps) {
  return (
    <Card className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight text-slate-900">{profile.full_name || 'Anonymous'}</h3>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge tone="neutral" size="sm" dot className="uppercase tracking-wide">{profile.role || 'guest'}</Badge>
              {profile.is_active === false && (
                <Badge tone="danger" size="sm" variant="outline" className="uppercase tracking-wide">
                  Deactivated
                </Badge>
              )}
            </div>
          </div>
        </div>
        <MemberMenu profile={profile} />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-line bg-slate-50 p-3 text-center">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Active</p>
          <div className="flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-slate-900">
            <ListTodo className="h-3.5 w-3.5 text-slate-400" />
            {stats.active}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-slate-50 p-3 text-center">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Today</p>
          <div className="flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-slate-900">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
            {stats.completedToday}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-slate-50 p-3 text-center">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Week</p>
          <div className="flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-slate-900">
            <Trophy className="h-3.5 w-3.5 text-slate-400" />
            {stats.completedThisWeek}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/tasks?assignee=${profile.id}`}
          className={buttonVariants({ variant: "secondary", className: "flex-1" })}
        >
          View Tasks
        </Link>
        <Button onClick={onAssign} variant="primary" className="flex-1">
          Assign
        </Button>
      </div>
    </Card>
  );
}
