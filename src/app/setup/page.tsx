"use client"

import { Users, Building2 } from "lucide-react"
import { MainLayout } from "@/libraries/components/layout/MainLayout"
import { UserManagement } from "@/libraries/components/settings/UserManagement"
import { OrganizationManagement } from "@/libraries/components/settings/OrganizationManagement"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SetupPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">System Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admin users and organization structure
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="flex flex-col">
          <TabsList variant="line">
            <TabsTrigger value="users">
              <Users size={14} />
              Users
            </TabsTrigger>
            <TabsTrigger value="organization">
              <Building2 size={14} />
              Organization
            </TabsTrigger>
          </TabsList>

          {/* Users tab */}
          <TabsContent value="users" className="mt-4">
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Admin Users</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Users with administrative access to the PGSQAF system
                </p>
              </div>
              <UserManagement />
            </div>
          </TabsContent>

          {/* Organization tab */}
          <TabsContent value="organization" className="mt-4">
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Organization Hierarchy</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage faculties, departments, and postgraduate programs
                </p>
              </div>
              <OrganizationManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
