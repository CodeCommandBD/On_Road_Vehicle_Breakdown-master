import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/layout/Sidebar";
import SupportForm from "@/components/dashboard/SupportForm";

export default function SupportPage() {
  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden font-outfit">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold">Help & Support</h1>
              <p className="text-white/60 mt-2">
                Need assistance? Our team is ready to help you get back on the
                road.
              </p>
            </div>

            <SupportForm />

            {/* Support Info Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-2 text-blue-400">
                  Email Us Directly
                </h3>
                <p className="text-sm text-white/60">
                  Prefer your own email client? Reach us at:
                  <br />
                  <span className="text-white font-mono mt-1 block">
                    support@breakdownbd.com
                  </span>
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-2 text-green-400">
                  Community Forum
                </h3>
                <p className="text-sm text-white/60">
                  Find answers from other users and our knowledge base.
                  <br />
                  <span className="text-white/40 text-xs mt-1 block">
                    (Coming Soon)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
