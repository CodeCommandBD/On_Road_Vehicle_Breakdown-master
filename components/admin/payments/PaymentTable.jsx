"use client";

import { Download, Search } from "lucide-react";

const transactions = [
  { id: "TX-9876", user: "Rahim Uddin", type: "Service Payment", amount: "৳8,500", status: "Completed", date: "16 Dec, 10:30 AM", method: "bkash" },
  { id: "TX-9877", user: "Karim Hasan", type: "Subscription (Premium)", amount: "৳499", status: "Completed", date: "16 Dec, 09:15 AM", method: "card" },
  { id: "TX-9878", user: "Alice Smith", type: "Service Payment", amount: "৳1,200", status: "Pending", date: "15 Dec, 04:45 PM", method: "nagad" },
  { id: "TX-9879", user: "Bob Wilson", type: "Service Payment", amount: "৳3,000", status: "Refunded", date: "14 Dec, 02:20 PM", method: "bkash" },
  { id: "TX-9880", user: "Garage Payout", type: "Payout", amount: "-৳15,000", status: "Completed", date: "12 Dec, 11:00 AM", method: "bank" },
];

export default function PaymentTable() {
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500/10 text-green-500";
      case "Pending": return "bg-orange-500/10 text-orange-500";
      case "Refunded": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between gap-4">
        <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
        <div className="flex gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
             <input type="text" placeholder="Search transaction..." className="bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF532D]" />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors">
             <Download size={16} /> Export
           </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-white/80 text-sm">{tx.id}</td>
                <td className="px-6 py-4 text-white font-medium">{tx.user}</td>
                <td className="px-6 py-4 text-white/70">{tx.type}</td>
                <td className={`px-6 py-4 font-bold ${tx.amount.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                  {tx.amount}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/40 text-sm">{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
