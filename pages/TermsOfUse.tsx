import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import NeuralBackground from '../components/NeuralBackground';

const TermsOfUse: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#020204] text-[#EEE] font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
            <NeuralBackground />

            <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
                <Link to="/" className="inline-flex items-center gap-2 text-[#888] hover:text-white transition-colors mb-8 group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest font-display">Back to Home</span>
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 font-display">Terms of Use</h1>
                    <p className="text-xl text-[#8E8EA0] mb-8 font-light">Last updated: {new Date().toLocaleDateString()}</p>

                    <div className="space-y-8 text-[#CCC] leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using WBBT Records ("the Platform"), you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Services Provided</h2>
                            <p>
                                WBBT Records functions as a digital record label, allowing artists to release, manage, and distribute their musical recordings to various digital service providers (DSPs) such as Spotify, Apple Music, and others under our label.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                            <p>
                                To access certain features of the Platform, you must create an account. You represent and warrant that the information you provide is accurate and complete. You are responsible for maintaining the confidentiality of your account credentials.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
                            <p>
                                You retain full ownership of the sound recordings and underlying musical compositions you upload. By using our service, you grant WBBT Records a limited, non-exclusive license to distribute, reproduce, and publicly perform your content for the purpose of fulfilling our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Prohibited Use</h2>
                            <p>
                                You agree not to upload content that infringes on third-party rights, is illegal, or violates our content guidelines (avoiding hate speech, unauthorized samples, etc.). We reserve the right to remove any content that violates these terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                            <p>
                                WBBT Records shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">7. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify these terms at any time. Your continued use of the Platform constitutes your acceptance of the revised terms.
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/10">
                        <p className="text-sm text-[#666]">
                            Contact: support@wbbt.net
                        </p>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default TermsOfUse;
