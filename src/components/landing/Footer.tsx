"use client";
import { motion } from "framer-motion";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { MedSevaLogo } from "../MedSevaLogo";

const footerLinks = {
  Product: ["Features", "AI Reports", "Dashboard", "Pricing", "Changelog"],
  Company: ["About", "Careers", "Blog", "Press", "Partners"],
  Resources: ["Documentation", "API Reference", "Status", "Support", "Community"],
  Legal: ["Privacy Policy", "Terms of Service", "HIPAA", "Security", "Cookies"],
};

export default function Footer() {
  return (
    <footer className="bg-[#0A0F1A] text-slate-400">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 pb-8">
        {/* Top Row */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <MedSevaLogo size="md" />
            </Link>
            <p className="text-sm leading-7 text-slate-500 max-w-xs">
              AI-powered healthcare management for patients, doctors, and caregivers to collaborate on safer, smarter care.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: <Github className="w-4 h-4" />, label: "GitHub" },
                { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
                { icon: <Twitter className="w-4 h-4" />, label: "Twitter" },
                { icon: <Mail className="w-4 h-4" />, label: "Email" },
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-200"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">{group}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-500 hover:text-white transition-colors duration-150"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8">
          <p className="text-xs text-slate-600">© 2026 MedSeva Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-xs text-slate-500">All systems operational</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
