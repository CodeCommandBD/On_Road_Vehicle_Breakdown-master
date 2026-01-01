"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Download, FileText, Send } from "lucide-react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

export default function InvoiceHistory() {
  const t = useTranslations("Settings.Billing");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const invoiceRes = await axios.get("/api/user/invoices");
      setInvoices(invoiceRes.data.invoices || []);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id, number) => {
    window.open(`/api/invoices/${id}/download`, "_blank");
  };

  const handleEmail = async (id) => {
    setSendingId(id);
    try {
      await axios.post(`/api/invoices/${id}/send`);
      toast.success(t("emailSent") || "Invoice sent to your email!");
    } catch (error) {
      toast.error(t("emailFailed") || "Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  if (loading) return <div className="p-4 text-gray-400">{t("loading")}</div>;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="text-blue-400" /> {t("title")}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">{t("invoiceNo")}</th>
              <th className="px-6 py-4">{t("date")}</th>
              <th className="px-6 py-4">{t("amount")}</th>
              <th className="px-6 py-4">{t("status")}</th>
              <th className="px-6 py-4 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr
                  key={inv._id}
                  className="hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-blue-300 font-medium">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {format(new Date(inv.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {inv.total} {inv.currency}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        inv.status === "paid"
                          ? "bg-green-500/20 text-green-400"
                          : inv.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEmail(inv._id)}
                      disabled={sendingId === inv._id}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                      title={t("sendEmail")}
                    >
                      {sendingId === inv._id ? (
                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(inv._id, inv.invoiceNumber)}
                      className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                      title={t("downloadPdf")}
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  {t("noInvoices")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
