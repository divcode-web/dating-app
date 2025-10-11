import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              <img
                src="/lovento-icon.png"
                alt="Lovento Logo"
                className="h-12 w-auto object-contain"
              />
              <span className="text-2xl font-bold leading-tight">Lovento</span>
            </div>
            <p className="text-gray-400 text-sm">
              Find your perfect match with our intelligent dating platform.
              Smart matching, real connections, lasting relationships.
            </p>
            <div className="flex space-x-3">
              {/* TODO: Replace with your actual social media URLs */}
              <a
                href="https://facebook.com/lovento"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-blue-600/20 transition-all"
                >
                  <Facebook className="w-5 h-5" />
                </Button>
              </a>
              <a
                href="https://twitter.com/lovento"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-sky-500/20 transition-all"
                >
                  <Twitter className="w-5 h-5" />
                </Button>
              </a>
              <a
                href="https://instagram.com/lovento"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-pink-600/20 transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </Button>
              </a>
              <a
                href="https://linkedin.com/company/lovento"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-blue-700/20 transition-all"
                >
                  <Linkedin className="w-5 h-5" />
                </Button>
              </a>
              <a
                href="https://t.me/lovento"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-blue-500/20 transition-all"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Premium
                </a>
              </li>
              <li>
                {/* TODO: Replace with your actual Telegram blog channel URL */}
                <a
                  href="https://t.me/lovento_blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  <Send className="w-4 h-4" />
                  Join Blog Channel
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Safety Tips
                </a>
              </li>
              <li>
                <a
                  href="/community-guidelines"
                  className="hover:text-white transition-colors"
                >
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Report a Problem
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@loventodate.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>1-800-DATING</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © 2024 Lovento. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </a>
              <a
                href="/community-guidelines"
                className="hover:text-white transition-colors"
              >
                Community Guidelines
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
