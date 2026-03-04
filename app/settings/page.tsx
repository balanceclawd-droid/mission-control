import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  return (
    <div
      className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${
        defaultOn ? "bg-emerald-600" : "bg-slate-700"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          defaultOn ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Configure your mission control preferences</p>
      </div>

      {/* General */}
      <Card>
        <SectionHeader title="General" />
        <SettingRow label="Display Name" description="Shown in the header and reports">
          <input
            type="text"
            defaultValue="Ryan"
            className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-sm text-slate-200 outline-none focus:border-slate-500 transition-colors w-28 text-right"
          />
        </SettingRow>
        <SettingRow label="Timezone" description="Used for scheduling and display times">
          <select className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-sm text-slate-200 outline-none cursor-pointer">
            <option>Europe/London</option>
            <option>UTC</option>
            <option>America/New_York</option>
          </select>
        </SettingRow>
        <SettingRow label="Currency" description="Used in pipeline and revenue displays">
          <select className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-sm text-slate-200 outline-none cursor-pointer">
            <option>GBP (£)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </SettingRow>
      </Card>

      {/* Notifications */}
      <Card>
        <SectionHeader title="Notifications" />
        <SettingRow label="Failing automations" description="Alert when an automation fails">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="New lead captured" description="Notify on new lead activity">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Daily digest" description="Morning summary of tasks and pipeline">
          <Toggle defaultOn={false} />
        </SettingRow>
        <SettingRow label="Deal stage changes" description="Notify when pipeline deals move">
          <Toggle defaultOn={true} />
        </SettingRow>
      </Card>

      {/* Appearance */}
      <Card>
        <SectionHeader title="Appearance" />
        <SettingRow label="Theme" description="Interface colour scheme">
          <select className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-sm text-slate-200 outline-none cursor-pointer">
            <option>Dark (default)</option>
            <option disabled>Light (coming soon)</option>
          </select>
        </SettingRow>
        <SettingRow label="Dense mode" description="Compact layout with tighter spacing">
          <Toggle defaultOn={false} />
        </SettingRow>
        <SettingRow label="Show emoji icons" description="Display emoji in nav and cards">
          <Toggle defaultOn={true} />
        </SettingRow>
      </Card>

      {/* Integrations */}
      <Card>
        <SectionHeader title="Integrations" subtitle="Connect your tools" />
        {[
          { name: "Notion", status: "Connected", icon: "📝" },
          { name: "Enreach", status: "Connected", icon: "🚀" },
          { name: "LinkedIn", status: "Connected", icon: "💼" },
          { name: "PhantomBuster", status: "Needs re-auth", icon: "👻" },
          { name: "Stripe", status: "Not connected", icon: "💳" },
        ].map((integration) => (
          <SettingRow
            key={integration.name}
            label={`${integration.icon} ${integration.name}`}
            description={integration.status}
          >
            <button
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                integration.status === "Connected"
                  ? "border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/40"
                  : integration.status === "Needs re-auth"
                  ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  : "border-slate-600 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {integration.status === "Connected"
                ? "Disconnect"
                : integration.status === "Needs re-auth"
                ? "Re-auth"
                : "Connect"}
            </button>
          </SettingRow>
        ))}
      </Card>

      {/* Danger zone */}
      <Card>
        <SectionHeader title="Danger Zone" />
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-slate-200">Reset all mock data</div>
            <div className="text-xs text-slate-500 mt-0.5">Restore all tables to default placeholder data</div>
          </div>
          <button className="px-3 py-1.5 rounded text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
            Reset Data
          </button>
        </div>
      </Card>
    </div>
  );
}
