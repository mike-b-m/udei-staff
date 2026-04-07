export default function Footer(){
    const currentYear = new Date().getFullYear()

    return(
        <footer className="bg-linear-to-r from-gray-900 to-gray-800 text-gray-100 border-t border-gray-700">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* About Section */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white mb-4">À Propos</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Université d'Études Internationales d'Haïti - Institution d'excellence académique
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Navigation</h4>
                        <ul className="space-y-2">
                            <li><a href="/admin" className="text-sm text-gray-400 hover:text-blue-400 transition">Accueil</a></li>
                            <li><a href="/admin/search" className="text-sm text-gray-400 hover:text-blue-400 transition">Recherche</a></li>
                            <li><a href="/admin/teacher" className="text-sm text-gray-400 hover:text-blue-400 transition">Enseignants</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition">Centre d'aide</a></li>
                            <li><a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition">Contact</a></li>
                            <li><a href="#" className="text-sm text-gray-400 hover:text-blue-400 transition">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Contact</h4>
                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>academy@udeihaiti.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>+509-4003-4090</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 pt-8"></div>

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row items-center justify-between">
                    {/* Copyright */}
                    <div className="text-sm text-gray-400 text-center md:text-left mb-4 md:mb-0">
                        <p>© {currentYear} Université d'Études Internationales d'Haïti. Tous droits réservés.</p>
                    </div>

                    {/* Legal Links */}
                    <div className="flex gap-6 text-sm text-gray-400">
                        <a href="#" className="hover:text-blue-400 transition">Politique de confidentialité</a>
                        <a href="#" className="hover:text-blue-400 transition">Conditions d'utilisation</a>
                        <a href="#" className="text-gray-500">v1.0.0</a>
                    </div>
                </div>

                {/* Version & Status */}
                <div className="mt-6 pt-6 border-t border-gray-700 text-xs text-gray-500 text-center">
                    <p>Système de Gestion Académique UDEI • Tous les systèmes fonctionnent correctement</p>
                </div>
            </div>
        </footer>
    )
}