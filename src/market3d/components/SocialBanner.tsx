import { SiteSettings } from "../types";
import { Send, MessageCircle, Instagram, ExternalLink, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface SocialBannerProps {
  settings: SiteSettings;
}

export default function SocialBanner({ settings }: SocialBannerProps) {
  return (
    <div className="w-full" id="social-banners-container">
      {/* Dynamic scrolling neon promo banner */}
      <div className="bg-amber-500 text-white py-2 px-4 text-xs font-bold uppercase tracking-wider overflow-hidden whitespace-nowrap relative rounded-xl mb-4 border border-amber-400 flex items-center justify-center shadow-xs">
        <motion.div
          animate={{ x: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-white fill-amber-300 animate-spin" />
          <span>
            {settings.bannerText || "ENTRE NO GRUPO DE COMENTÁRIOS E GARANTA SUPORTE EXCLUSIVO!"}
          </span>
          <Sparkles className="w-4 h-4 text-white fill-amber-300 animate-pulse" />
        </motion.div>
      </div>

      {/* Grid of group invitations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {settings.whatsappLink && (
          <motion.a
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            href={settings.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            id="whatsapp-banner"
          >
            <div className="absolute -right-3 -bottom-3 text-white/10 opacity-70 group-hover:scale-110 transition-transform duration-500">
              <MessageCircle className="w-24 h-24 stroke-1" />
            </div>

            <div className="flex items-center gap-3 z-10">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <MessageCircle className="w-6 h-6 fill-white text-emerald-500" />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-green-100 uppercase">
                  Grupo Vip
                </span>
                <h4 className="font-bold text-sm leading-tight text-white block">WhatsApp Chat</h4>
              </div>
            </div>

            <div className="bg-white/20 p-2 rounded-lg text-white group-hover:bg-white/30 transition-colors z-10">
              <ExternalLink className="w-4 h-4" />
            </div>
          </motion.a>
        )}

        {settings.telegramLink && (
          <motion.a
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            href={settings.telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            id="telegram-banner"
          >
            <div className="absolute -right-3 -bottom-3 text-white/10 opacity-70 group-hover:scale-110 transition-transform duration-500">
              <Send className="w-24 h-24 stroke-1 -rotate-12" />
            </div>

            <div className="flex items-center gap-3 z-10">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Send className="w-6 h-6 fill-white text-sky-500" />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-sky-100 uppercase">
                  Canal de Cupons
                </span>
                <h4 className="font-bold text-sm leading-tight text-white block">
                  Telegram Channel
                </h4>
              </div>
            </div>

            <div className="bg-white/20 p-2 rounded-lg text-white group-hover:bg-white/30 transition-colors z-10">
              <ExternalLink className="w-4 h-4" />
            </div>
          </motion.a>
        )}

        {settings.instagramLink && (
          <motion.a
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            href={settings.instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            id="instagram-banner"
          >
            <div className="absolute -right-3 -bottom-3 text-white/10 opacity-70 group-hover:scale-110 transition-transform duration-500">
              <Instagram className="w-24 h-24 stroke-1" />
            </div>

            <div className="flex items-center gap-3 z-10">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Instagram className="w-6 h-6 text-pink-100" />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-rose-100 uppercase">
                  Siga no Instagram
                </span>
                <h4 className="font-bold text-sm leading-tight text-white block">
                  @achadinhos_insta
                </h4>
              </div>
            </div>

            <div className="bg-white/20 p-2 rounded-lg text-white group-hover:bg-white/30 transition-colors z-10">
              <ExternalLink className="w-4 h-4" />
            </div>
          </motion.a>
        )}
      </div>
    </div>
  );
}
