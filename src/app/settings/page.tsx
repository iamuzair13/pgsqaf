import { MainLayout } from "@/libraries/components/layout/MainLayout"
import { UserManagement } from "@/libraries/components/settings/UserManagement"

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system users and administrative access
          </p>
        </div>

        {/* User management section */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Admin Users</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Users with administrative access to the PGSQAF system
              </p>
            </div>
          </div>
          <UserManagement />
        </div>
      </div>
    </MainLayout>
  )
}
