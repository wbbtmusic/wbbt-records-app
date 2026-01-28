import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import NeuralBackground from '../components/NeuralBackground';

const PublisherAgreement: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#020204] text-[#EEE] font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
            <NeuralBackground />

            <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
                <Link to="/" className="inline-flex items-center gap-2 text-[#888] hover:text-white transition-colors mb-8 group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest font-display">Back to Home</span>
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 font-display">Publisher Agreement</h1>
                    <p className="text-xl text-[#8E8EA0] mb-8 font-light">Label & Licensing Agreement</p>

                    <div className="space-y-8 text-[#CCC] leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Grant of Rights</h2>
                            <p>
                                By signing this agreement with WBBT Records (the "Label"), you grant the Label exclusive rights to distribute, license, and monetize your Recordings and Artwork via Digital Service Providers (DSPs). You retain ownership of your underlying copyrights, licensing them to the Label for the term of this agreement.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Royalties & Payouts</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Net Receipts:</strong> We will pay you 70% of the Net Receipts actually received by us from DSPs for your Recordings. WBBT Records retains 30% as a label commission.
                                </li>
                                <li>
                                    <strong>Payment Timing:</strong> Royalties are reported and paid monthly, subject to a minimum withdrawal threshold (e.g., $50). Reporting usually occurs 45-60 days after the end of the month in which streams occurred.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Warranties & Representations</h2>
                            <p>
                                You warrant and represent that:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>You are at least 18 years of age or have legal guardian consent.</li>
                                <li>You own or control all rights to the Recordings and Compositions (including samples).</li>
                                <li>Your content does not infringe upon the rights of any third party.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Takedowns</h2>
                            <p>
                                You may request the removal of your Releases from DSPs at any time via the Admin Panel. We will issue takedown notices to DSPs within 2-5 business days. Note that DSPs may take additional time to process removal.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Marketing Consent</h2>
                            <p>
                                You agree that WBBT Records may use your Name, Likeness, and Artwork for promotional purposes related to the Label and your Releases. You also consent to receiving marketing communications from us regarding new features, opportunities, and industry news.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Termination</h2>
                            <p>
                                Either party may terminate this agreement at any time. Upon termination, we will issue takedown notices for all your distributed content. Any unpaid royalties accrued prior to termination will be paid out in next cylce.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">7. Governing Law</h2>
                            <p>
                                This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which WBBT Records is incorporated.
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/10">
                        <p className="text-sm text-[#666]">
                            WBBT Records Legal Team
                        </p>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default PublisherAgreement;
