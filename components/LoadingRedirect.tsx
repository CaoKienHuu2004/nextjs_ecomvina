"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function LoadingRedirect({ message = "Đang chuyển sang VNPay..." }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      
      {/* Vòng xoay */}
      <motion.div
        className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />

      {/* Chữ chạy */}
      <motion.p
        className="mt-6 text-lg font-medium text-gray-700"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {message}
      </motion.p>

      <p className="mt-2 text-sm text-gray-400">
        Vui lòng không đóng hoặc làm mới trang
      </p>
    </div>
  );
}
