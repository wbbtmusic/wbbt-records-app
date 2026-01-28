import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input, Select, Badge } from '../components/ui.tsx';
import { UploadCloud, CheckCircle, Music, Image as ImageIcon, Globe, FileText, Wand2, Copyright, Hash, Mic2, AlertTriangle, Play, Pause, Calendar, User as UserIcon, Plus, Trash2, Link as LinkIcon, Save, Lock, AlertOctagon, ChevronDown, ChevronUp, Disc, X } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Release, ReleaseStatus, ContentOwnership, Track, ReleaseArtist } from '../types';
import { GENRES, STORES, LANGUAGES } from '../constants';

const STEPS = [
    { id: 1, label: 'Type', icon: Disc },
    { id: 2, label: 'Upload', icon: UploadCloud },
    { id: 3, label: 'Details', icon: Music },
    { id: 4, label: 'Metadata', icon: FileText }, // Contains Legal Docs
    { id: 5, label: 'Artwork', icon: ImageIcon },
    { id: 6, label: 'Stores', icon: Globe },
    { id: 7, label: 'Review', icon: CheckCircle },
];

const ReleaseWizard: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
    const [isEditingExisting, setIsEditingExisting] = useState(false);
    const [showTakedownConfirm, setShowTakedownConfirm] = useState(false);

    // Audio Preview
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    // Upload Progress
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);
    const [docUploadProgress, setDocUploadProgress] = useState<number | null>(null);

    // -- Global Form State --
    const [user, setUser] = useState<any>(null);
    const [artistLibrary, setArtistLibrary] = useState<ReleaseArtist[]>([]);
    const [writerLibrary, setWriterLibrary] = useState<any[]>([]);
    const [highlightError, setHighlightError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Tracks
    const [tracks, setTracks] = useState<Track[]>([]);
    const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

    // Release Info
    const [releaseTitle, setReleaseTitle] = useState('');
    const [releaseType, setReleaseType] = useState<'Single' | 'EP' | 'Album'>('Single');
    const [genre, setGenre] = useState(GENRES[0]);
    const [subGenre, setSubGenre] = useState('');

    const [cLine, setCLine] = useState(user?.artistName || '');
    const [cYear, setCYear] = useState(new Date().getFullYear().toString());
    const [pLine, setPLine] = useState(user?.artistName || '');
    const [pYear, setPYear] = useState(new Date().getFullYear().toString());
    const [recordLabel, setRecordLabel] = useState('');

    // Advanced Metadata
    const [mainArtist, setMainArtist] = useState(user?.artistName || '');
    const [distributedBefore, setDistributedBefore] = useState(false);
    const [originalReleaseDate, setOriginalReleaseDate] = useState('');
    const [upc, setUpc] = useState('');
    const [originalUpc, setOriginalUpc] = useState('');

    // Artwork
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    // Distribution
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [monetization, setMonetization] = useState({
        youtubeContentId: false,
        tikTok: false,
        facebook: false,
        instagram: false
    });
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 20);
    const [releaseDate, setReleaseDate] = useState(minDate.toISOString().split('T')[0]);
    const [releaseTiming, setReleaseTiming] = useState<'ASAP' | 'Specific'>('ASAP');
    const [territory, setTerritory] = useState<'Global' | 'Restricted'>('Global');
    const [confirmRights, setConfirmRights] = useState(false);
    const [confirmAccuracy, setConfirmAccuracy] = useState(false);
    const [confirmCommission, setConfirmCommission] = useState(false);
    const [confirmLiability, setConfirmLiability] = useState(false);
    const [viewingContract, setViewingContract] = useState<string | null>(null);
    const [showAllPlatforms, setShowAllPlatforms] = useState(false);
    const [documents, setDocuments] = useState<string[]>([]); // New state for documents
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Load data
    useEffect(() => {
        const loadData = async () => {
            const currentUser = await apiService.getCurrentUser();
            if (!currentUser) return;

            if (currentUser) {
                setUser(currentUser);
                setCLine(currentUser.artistName || '');
                setPLine(currentUser.artistName || '');

                if (id) {
                    const releases = await apiService.getReleases(currentUser.id);
                    const existingRelease = releases.find((r: any) => r.id === id);
                    if (existingRelease && existingRelease.userId === currentUser.id) {
                        setIsEditingExisting(true);
                        setReleaseTitle(existingRelease.title);
                        setReleaseType(existingRelease.type);
                        setGenre(existingRelease.genre);
                        setSubGenre(existingRelease.subGenre || '');
                        setCLine(existingRelease.cLine);
                        setCYear(existingRelease.cYear);
                        setPLine(existingRelease.pLine);
                        setPYear(existingRelease.pYear);
                        setRecordLabel(existingRelease.recordLabel || '');
                        // Only load UPC if it's a real user-entered code (not WBBT auto-generated)
                        const userUpc = existingRelease.upc && !existingRelease.upc.startsWith('WBBT') ? existingRelease.upc : '';
                        setUpc(userUpc);
                        setOriginalUpc(userUpc);
                        setCoverUrl(existingRelease.coverUrl ? existingRelease.coverUrl.replace(/^https?:\/\/localhost:\d+/, '') : null);
                        setTracks((existingRelease.tracks || []).map((t: any) => ({
                            ...t,
                            fileUrl: t.fileUrl ? t.fileUrl.replace(/^https?:\/\/localhost:\d+/, '') : t.fileUrl
                        })));
                        setSelectedStores(existingRelease.selectedStores || []);
                        setMonetization(existingRelease.monetization || { tikTok: false, youtubeContentId: false, facebookInstagram: false });
                        setReleaseDate(existingRelease.releaseDate);
                        setReleaseTiming(existingRelease.releaseTiming);

                        setMainArtist(existingRelease.mainArtist || currentUser.artistName || '');
                        setDistributedBefore(existingRelease.distributedBefore);
                        setOriginalReleaseDate(existingRelease.originalReleaseDate || '');
                        setDocuments(existingRelease.documents || []);  // Load documents
                        setCurrentStep(1);
                    }
                }
            }

            // Load artist library from database
            try {
                const artists = await apiService.getArtistLibrary(currentUser.id);
                setArtistLibrary(artists || []);
            } catch (e) {
                console.error('Failed to load artist library:', e);
            }

            // Load writer library from database
            try {
                const writers = await apiService.getWriterLibrary(currentUser.id);
                setWriterLibrary(writers || []);
            } catch (e) {
                console.error('Failed to load writer library:', e);
            }
        };
        loadData();
    }, [id]);

    // Validate tracks before moving to metadata
    const validateTracks = () => {
        let isValid = true;
        // Check artists
        for (const track of tracks) {
            if (track.artists.length === 0) {
                alert('Each track must have at least one artist');
                isValid = false;
                break;
            }
            if (!track.artists[0].name) {
                alert('Artist name is required');
                isValid = false;
                break;
            }
            // Check writers
            if (!track.writers || track.writers.length === 0) {
                setHighlightError('writer');
                // Scroll to writer section
                const writerSection = document.getElementById('writers-section');
                if (writerSection) writerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                isValid = false;
                break;
            }
            const hasValidWriter = track.writers.some((w: any) => w.name || w.legalName);
            if (!hasValidWriter) {
                setHighlightError('writer');
                isValid = false;
                break;
            }
        }

        if (isValid) {
            setHighlightError(null);
            setCurrentStep(4);
        }
    };

    // Save artist to library (database)
    const saveArtistToLibrary = async (artist: ReleaseArtist) => {
        if (!artist.name) return;
        // Check if already in library
        if (artistLibrary.some(a => a.name.toLowerCase() === artist.name.toLowerCase())) {
            alert('Artist already in library!');
            return;
        }
        try {
            const newArtist = await apiService.createArtist({
                name: artist.name,
                role: artist.role,
                legalName: artist.legalName || '',
                spotifyUrl: artist.spotifyUrl || '',
                appleId: artist.appleId || ''
            });
            setArtistLibrary(prev => [...prev, { ...newArtist, id: newArtist.id || `lib-${Date.now()}` }]);
            alert(`Saved "${artist.name}" to your artist library!`);
        } catch (e) {
            console.error('Failed to save artist:', e);
            alert('Failed to save artist to library');
        }
    };

    // Save writer to library (database)
    const saveWriterToLibrary = async (writer: any) => {
        if (!writer.name) return;
        // Check if already in library
        if (writerLibrary.some(w => w.name.toLowerCase() === writer.name.toLowerCase())) {
            alert('Writer already in library!');
            return;
        }
        try {
            const newWriter = await apiService.createWriter({
                name: writer.name,
                role: writer.role,
                legalName: writer.legalName || writer.name
            });
            setWriterLibrary(prev => [...prev, { ...newWriter, id: newWriter.id || `lib-${Date.now()}` }]);
            alert(`Saved "${writer.name}" to your writer library!`);
        } catch (e) {
            console.error('Failed to save writer:', e);
            alert('Failed to save writer to library');
        }
    };

    // Handle audio file upload
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadProgress(0); // Start progress
        setCurrentStep(3); // Move to Details step immediately to show progress there

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const base64 = event.target?.result as string;
                    // Use new progress-aware upload
                    const result = await apiService.uploadFileWithProgress(
                        file.name,
                        base64,
                        'audio',
                        (percent) => setUploadProgress(percent)
                    );

                    const newTrack: Track = {
                        id: `trk-${Date.now()}-${i}`,
                        title: file.name.replace(/\.[^/.]+$/, ''),
                        duration: 0,
                        fileUrl: result.url,
                        fileId: result.fileId,
                        artists: [{ id: `art-${Date.now()}`, name: user?.artistName || '', role: 'Primary Artist' }],
                        language: 'English',
                        isInstrumental: false,
                        isExplicit: false,
                        compositionType: 'Original',
                        copyrightType: 'Original',
                        aiUsage: 'None',
                        previewStartTime: '00:00',
                        writers: [],
                        genre,
                        subGenre
                    };

                    setTracks(prev => [...prev, newTrack]);
                    if (tracks.length === 0) setReleaseTitle(newTrack.title);
                    setEditingTrackId(newTrack.id);

                } catch (err) {
                    console.error('Failed to upload audio:', err);
                    alert('Failed to upload audio file');
                } finally {
                    // Reset progress after last file or on error
                    if (i === files.length - 1) {
                        setUploadProgress(null);
                        // No need to change step here anymore
                    }
                }
            };

            reader.readAsDataURL(file);
        }
    };

    // Handle cover art upload
    const handleCoverStart = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const { width, height } = img;
            if (width !== height) {
                alert('Cover art must be a perfect square (1:1 ratio).');
                return;
            }
            if (width < 3000 || width > 5000) {
                alert('Cover art dimensions must be between 3000x3000px and 5000x5000px.');
                return;
            }
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    setCoverUploadProgress(0);
                    const base64 = event.target?.result as string;
                    // Use progress upload
                    const result = await apiService.uploadFileWithProgress(
                        file.name,
                        base64,
                        'image',
                        (percent) => setCoverUploadProgress(percent)
                    );
                    setCoverUrl(result.url);
                } catch (err) {
                    console.error(err);
                    alert('Failed to upload cover art');
                } finally {
                    setCoverUploadProgress(null);
                }
            };
            reader.readAsDataURL(file);
        };
    };

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    setDocUploadProgress(0);
                    const base64 = event.target?.result as string;
                    // Use progress upload
                    const result = await apiService.uploadFileWithProgress(
                        file.name,
                        base64,
                        'document',
                        (percent) => setDocUploadProgress(percent)
                    );
                    setDocuments(prev => [...prev, result.url]);
                } catch (err) {
                    console.error('Failed to upload document:', err);
                    alert('Failed to upload document');
                } finally {
                    setDocUploadProgress(null);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddTrack = () => {
        if (isEditingExisting) return;
        const newTrack: Track = {
            id: `trk-${Date.now()}`,
            title: 'New Track',
            duration: 0,
            fileUrl: '',
            artists: [
                { id: `art-${Date.now()}`, name: user?.artistName || '', role: 'Primary Artist' }
            ],
            language: 'English',
            isInstrumental: false,
            isExplicit: false,
            compositionType: 'Original',
            copyrightType: 'Original',
            aiUsage: 'None',
            previewStartTime: '00:00',
            writers: []
        };
        setTracks([...tracks, newTrack]);
        if (tracks.length === 0) setReleaseTitle(newTrack.title);
        setEditingTrackId(newTrack.id);
        if (currentStep === 1) setCurrentStep(3);
    };

    const handleUpdateTrack = (id: string, updates: Partial<Track>) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleUpdateArtist = (trackId: string, artistIndex: number, updates: Partial<ReleaseArtist>) => {
        const track = tracks.find(t => t.id === trackId);
        if (!track) return;
        const newArtists = [...track.artists];
        newArtists[artistIndex] = { ...newArtists[artistIndex], ...updates };
        handleUpdateTrack(trackId, { artists: newArtists });
    };

    const handleArtistNameChange = (trackId: string, artistIndex: number, newName: string) => {
        // Only update the name - do NOT auto-fill other fields while typing
        // Auto-fill happens only when user clicks a suggestion from the dropdown
        handleUpdateArtist(trackId, artistIndex, { name: newName });
    };


    const handleAddArtist = (trackId: string) => {
        const track = tracks.find(t => t.id === trackId);
        if (!track) return;
        const newArtist: ReleaseArtist = { id: `art-${Date.now()}`, name: '', role: 'Featured' };
        handleUpdateTrack(trackId, { artists: [...track.artists, newArtist] });
    };

    const handleRemoveArtist = (trackId: string, idx: number) => {
        const track = tracks.find(t => t.id === trackId);
        if (!track) return;
        const newArtists = [...track.artists];
        newArtists.splice(idx, 1);
        handleUpdateTrack(trackId, { artists: newArtists });
    };

    const handleDeleteTrack = (trackId: string) => {
        const track = tracks.find(t => t.id === trackId);
        if (track) {
            setTrackToDelete(track);
        }
    };

    const confirmDelete = () => {
        if (!trackToDelete) return;

        setTracks(prev => prev.filter(t => t.id !== trackToDelete.id));
        if (editingTrackId === trackToDelete.id) {
            setEditingTrackId(null);
        }
        setTrackToDelete(null);
    };

    const cancelDelete = () => {
        setTrackToDelete(null);
    };


    const validateRelease = () => {
        if (!releaseTitle) { alert('Please enter a Release Title.'); return false; }
        if (!releaseType) { alert('Please select a Release Type.'); return false; }
        if (!genre) { alert('Please select a Primary Genre.'); return false; }
        if (!cLine) { alert('Please enter C Line info.'); return false; }
        if (!pLine) { alert('Please enter P Line info.'); return false; }
        if (!coverUrl) { alert('Please upload a Cover Art.'); return false; }
        if (selectedStores.length === 0) { alert('Please select at least one Store for distribution.'); return false; }
        if (tracks.length === 0) { alert('Please add at least one track.'); return false; }

        // Check for Producer
        const hasProducer = tracks.some(t => t.artists.some(a => a.role === 'Producer'));
        if (!hasProducer) {
            alert('Every release must have at least one "Producer" credited on a track.');
            return false;
        }

        // Check for Legal Names on Composers/Lyricists
        // In the new Writer flow, Name is often the Legal Name. We check if either is present to be safe, 
        // as legacy data might only have 'name'.
        for (const track of tracks) {
            const hasWriters = (track.writers || []).length > 0;
            // Strict check: Must have at least one writer
            if (!hasWriters) {
                alert(`Track "${track.title}" has no Credits/Rights holders. You must add at least one Songwriter.`);
                return false;
            }

            const missingLegal = (track.writers || []).some((w: any) => !w.legalName && !w.name);
            if (missingLegal) {
                alert(`Please provide the Legal Name (or Name) for all Composers, Lyricists, and Songwriters on track "${track.title}".`);
                return false;
            }
        }

        return true;
    };

    const handleSaveDraft = async () => {
        if (!releaseTitle) {
            alert('Please enter a Release Title to save a draft.');
            return;
        }
        setSubmitting(true);
        try {
            const releaseData = {
                id: id || crypto.randomUUID(),
                userId: user.id,
                title: releaseTitle,
                type: releaseType,
                genre,
                subGenre,
                status: 'DRAFT',
                coverUrl,
                cLine,
                cYear,
                pLine,
                pYear,
                recordLabel,
                upc: upc, // User's UPC goes here
                releaseDate,
                releaseTiming,
                distributedBefore,
                originalReleaseDate,
                mainArtist,
                selectedStores,
                monetization,
                territory,
                tracks,
                documents,
            };

            if (isEditingExisting && id) {
                await apiService.updateReleaseData(id, releaseData);
            } else {
                await apiService.createRelease(releaseData);
            }
            alert('Draft saved successfully! \nNote: Drafts are automatically deleted after 30 days of inactivity.');
            navigate('/dashboard'); // User said "Save and Exit", imply leaving wizard.
            // window.location.href = '/dashboard';
        } catch (error) {
            console.error(error);
            alert('Failed to save draft');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateRelease()) return;
        setSubmitting(true);
        try {
            const releaseData = {
                id: id || crypto.randomUUID(),
                userId: user.id,
                title: releaseTitle,
                type: releaseType,
                genre,
                subGenre,
                status: isEditingExisting ? 'EDITING' : 'PENDING',
                coverUrl,
                cLine,
                cYear,
                pLine,
                pYear,
                recordLabel,
                upc: upc, // User's UPC goes here
                releaseDate,
                releaseTiming,
                distributedBefore,
                originalReleaseDate,
                mainArtist,
                selectedStores,
                monetization,
                territory,
                tracks,
                documents,
                confirmations: {
                    rights: confirmRights,
                    accuracy: confirmAccuracy,
                    commission: confirmCommission,
                    liability: confirmLiability
                }
            };

            if (isEditingExisting && id) {
                await apiService.updateReleaseData(id, releaseData);
            } else {
                await apiService.createRelease(releaseData);
            }
            setSubmitSuccess(true);
        } catch (error) {
            console.error(error);
            alert('Failed to submit release');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTakedown = async () => {
        if (!id) return;
        if (!confirm('Are you sure you want to request a takedown? This will remove your release from all stores.')) return;
        try {
            await apiService.requestTakedown(id);
            alert('Takedown request submitted successfully.');
            navigate('/releases');
        } catch (e) {
            console.error('Takedown failed:', e);
            alert('Failed to request takedown. Please try again.');
        }
    };

    const toggleTrackEdit = (id: string) => {
        setEditingTrackId(editingTrackId === id ? null : id);
    };

    const handlePlayPreview = (track: Track) => {
        if (playingTrackId === track.id) {
            audioRef.current?.pause();
            setPlayingTrackId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const url = track.fileUrl.startsWith('http') ? track.fileUrl : track.fileUrl;
            audioRef.current = new Audio(url);
            audioRef.current.play().catch(e => console.error("Play error:", e));
            audioRef.current.onended = () => setPlayingTrackId(null);
            setPlayingTrackId(track.id);
        }
    };

    return (
        // Success Page
        submitSuccess ? (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black"
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            >
                {/* Purple Glow Background */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Center purple glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-600/30 via-purple-900/10 to-transparent rounded-full blur-3xl animate-pulse" />
                    {/* Secondary glow */}
                    <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-radial from-indigo-500/20 to-transparent rounded-full blur-2xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-radial from-pink-500/15 to-transparent rounded-full blur-2xl" />
                </div>

                {/* Mouse-following Spotlight */}
                <div
                    className="pointer-events-none fixed w-[400px] h-[400px] rounded-full blur-3xl"
                    style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)'
                    }}
                />

                <style>{`
                    @keyframes circle-grow { 0% { transform: scale(0); } 100% { transform: scale(1); } }
                    @keyframes check-stroke { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
                    @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.8); opacity: 0; } }
                    @keyframes fade-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                `}</style>

                {/* Success Card */}
                <div className="relative z-10 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-white/10 rounded-[32px] p-8 max-w-md mx-4 text-center shadow-2xl">
                    {/* Apple-style Animated Check Circle */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-green-500/20" style={{ animation: 'pulse-ring 2s ease-out infinite 1s' }} />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/40" style={{ animation: 'circle-grow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }} />
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                            <path d="M30 52 L45 67 L70 37" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" strokeDashoffset="50" style={{ animation: 'check-stroke 0.4s ease-out 0.5s forwards' }} />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2 font-display" style={{ animation: 'fade-up 0.5s ease-out 0.7s both' }}>Release Submitted! 🎉</h1>
                    <p className="text-sm text-white/70 mb-6" style={{ animation: 'fade-up 0.5s ease-out 0.8s both' }}>"{releaseTitle}" is now pending review</p>

                    <div className="flex gap-3 mb-6" style={{ animation: 'fade-up 0.5s ease-out 0.9s both' }}>
                        <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10"><div className="text-xs text-white/50">Review</div><div className="text-sm font-bold text-white">1-3 Days</div></div>
                        <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10"><div className="text-xs text-white/50">Delivery</div><div className="text-sm font-bold text-white">7-14 Days</div></div>
                    </div>

                    <div className="flex items-center justify-center gap-1 mb-6 text-xs" style={{ animation: 'fade-up 0.5s ease-out 1s both' }}>
                        <span className="text-green-400">Submitted</span><span className="text-white/30">→</span><span className="text-yellow-400">Review</span><span className="text-white/30">→</span><span className="text-white/40">Stores</span><span className="text-white/30">→</span><span className="text-white/40">Live 🎵</span>
                    </div>

                    <div className="flex gap-3 justify-center" style={{ animation: 'fade-up 0.5s ease-out 1.1s both' }}>
                        <Button variant="accent" onClick={() => { setSubmitSuccess(false); navigate('/releases'); }} className="px-6 text-sm">View Releases</Button>
                        <Button variant="secondary" className="text-sm" onClick={() => { setSubmitSuccess(false); setCurrentStep(1); setTracks([]); setReleaseTitle(''); setCoverUrl(null); }}>New Release</Button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col xl:flex-row gap-8 min-h-screen">
                {/* Liquid Sidebar Navigation */}
                <div className="xl:w-[320px] flex-shrink-0">
                    <div className="sticky top-24 glass-panel rounded-[40px] p-6">
                        <h2 className="text-white font-display font-bold mb-6 px-2 text-xl tracking-tight">{isEditingExisting ? 'Edit Release' : 'New Release'}</h2>
                        <div className="space-y-2">
                            {STEPS.map((step) => {
                                const Icon = step.icon;
                                const isActive = step.id === currentStep;
                                const isDone = step.id < currentStep;

                                return (
                                    <div
                                        key={step.id}
                                        onClick={() => { if (isDone) setCurrentStep(step.id) }}
                                        className={`flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 cursor-pointer ${isActive ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-white shadow-lg' : isDone ? 'text-white/80 hover:bg-white/5 border border-transparent' : 'text-white/30 pointer-events-none border border-transparent'}`}
                                    >
                                        <div className={`p-2 rounded-xl ${isActive ? 'bg-indigo-500 text-white' : isDone ? 'bg-green-500/20 text-green-400' : 'bg-white/5'}`}>
                                            {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
                                        </div>
                                        <span className="text-sm font-bold tracking-wide">
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 pb-20">

                    {/* Step 1: Release Type Selection */}
                    {currentStep === 1 && (
                        <div className="animate-fade-in space-y-8">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-white font-display mb-2">Select Release Type</h2>
                                <p className="text-[#888]">Choose the format of your release. This affects track limits and pricing.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Single */}
                                <div
                                    onClick={() => setReleaseType('Single')}
                                    className={`cursor-pointer group relative p-8 rounded-[40px] border-2 transition-all duration-300 ease-wise-ease ${releaseType === 'Single' ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-colors ${releaseType === 'Single' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white'}`}>
                                        <Disc size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Single</h3>
                                    <p className="text-sm text-[#888] mb-4">Release a single track to all major platforms.</p>
                                    <ul className="text-xs text-[#666] space-y-2">
                                        <li className="flex items-center gap-2"><CheckCircle size={12} className="text-indigo-400" /> Exactly 1 Track</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={12} className="text-indigo-400" /> Quick Distribution</li>
                                    </ul>
                                </div>

                                {/* EP */}
                                <div
                                    onClick={() => setReleaseType('EP')}
                                    className={`cursor-pointer group relative p-8 rounded-[40px] border-2 transition-all duration-300 ease-wise-ease ${releaseType === 'EP' ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-colors ${releaseType === 'EP' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white'}`}>
                                        <Disc size={28} />
                                        <div className="absolute top-10 right-10 flex">
                                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">EP</h3>
                                    <p className="text-sm text-[#888] mb-4">Extended Play. Perfect for a short collection of work.</p>
                                    <ul className="text-xs text-[#666] space-y-2">
                                        <li className="flex items-center gap-2"><CheckCircle size={12} className="text-indigo-400" /> 2 - 6 Tracks</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={12} className="text-indigo-400" /> Coherent theme</li>
                                    </ul>
                                </div>

                                {/* Album */}
                                <div
                                    onClick={() => setReleaseType('Album')}
                                    className={`cursor-pointer group relative p-8 rounded-[40px] border-2 transition-all duration-300 ease-wise-ease ${releaseType === 'Album' ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-colors ${releaseType === 'Album' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white'}`}>
                                        <Music size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Album</h3>
                                    <p className="text-sm text-[#888] mb-4">Full length studio album. Tell your complete story.</p>
                                    <ul className="text-xs text-[#666] space-y-2">
                                        <li className="flex items-center gap-2"><CheckCircle size={12} className="text-indigo-400" /> 7+ Tracks</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={12} className="text-indigo-400" /> Premium Placement</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end mt-8">
                                <Button variant="accent" onClick={() => setCurrentStep(2)}>
                                    Continue to Upload <ChevronDown className="ml-2 rotate-[-90deg]" size={16} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Upload (LOCKED IF EDITING - Shows Takedown) */}
                    {currentStep === 2 && (
                        <div className="animate-fade-in space-y-6">
                            {isEditingExisting ? (
                                <Card className="flex flex-col items-center justify-center py-20 text-center border-yellow-500/20 bg-yellow-900/10">
                                    <Lock size={48} className="text-yellow-500 mb-4" />
                                    <h3 className="text-2xl font-bold text-white mb-2">Audio Locked</h3>
                                    <p className="text-[#CCC] max-w-md">To preserve streaming counts and playlist placements, you cannot change audio files or add/remove tracks on distributed releases.</p>

                                    <div className="flex gap-4 mt-8">
                                        <Button
                                            variant="danger"
                                            onClick={() => setShowTakedownConfirm(true)}
                                            type="button"
                                            className="shadow-lg shadow-red-900/20"
                                        >
                                            <AlertOctagon size={18} className="mr-2" /> Request Takedown
                                        </Button>
                                        <Button variant="secondary" onClick={() => setCurrentStep(3)}>Go to Details</Button>
                                    </div>
                                </Card>
                            ) : (
                                <>
                                    {uploadProgress !== null ? (
                                        <Card className="py-24 flex flex-col items-center justify-center text-center">
                                            <div className="w-full max-w-md space-y-4">
                                                <div className="flex justify-between text-sm text-gray-400">
                                                    <span>Uploading...</span>
                                                    <span>{Math.round(uploadProgress)}%</span>
                                                </div>
                                                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 transition-all duration-300 ease-out relative overflow-hidden"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    >
                                                        {/* Shine effect */}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_1.5s_infinite]" />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 animate-pulse">Please wait while we process your audio...</p>
                                            </div>
                                        </Card>
                                    ) : (
                                        <label className="border border-dashed border-white/20 hover:border-indigo-500/50 hover:bg-white/5 bg-white/[0.02] rounded-[3rem] p-24 text-center transition-all cursor-pointer group backdrop-blur-sm block">
                                            <input
                                                type="file"
                                                accept="audio/*,.wav,.flac,.aiff,.mp3"
                                                multiple
                                                className="hidden"
                                                onChange={handleAudioUpload}
                                            />
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                <UploadCloud size={32} className="text-white/60 group-hover:text-white" />
                                            </div>
                                            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-start gap-3 mb-6 mx-auto max-w-2xl text-left">
                                                <Copyright className="text-blue-400 mt-1 flex-shrink-0" size={18} />
                                                <div>
                                                    <h4 className="text-blue-400 font-bold text-sm">Automated Copyright Check</h4>
                                                    <p className="text-blue-300/70 text-xs mt-1">
                                                        Files will be analyzed by ACRCloud after submission. Please ensure you own 100% of the rights.
                                                    </p>
                                                </div>
                                            </div>
                                            <h3 className="text-3xl font-display font-bold text-white mb-3">Drop files here</h3>
                                            <p className="text-white/50 text-sm mb-8">WAV, FLAC, AIFF, MP3 supported. Click to browse.</p>
                                            <span className="inline-block bg-white/10 hover:bg-white/20 text-white px-10 py-3 rounded-full text-sm font-medium transition-colors">Browse Files</span>
                                        </label>
                                    )}
                                </>
                            )}

                            {tracks.length > 0 && !isEditingExisting && uploadProgress === null && (
                                <Card>
                                    <h4 className="text-white font-bold mb-6 text-lg">Uploaded Tracks</h4>
                                    {tracks.map((t, i) => (
                                        <div key={t.id} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${playingTrackId === t.id ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)] scale-110' : 'bg-white text-black hover:bg-gray-200 hover:scale-105'}`}
                                                    onClick={() => handlePlayPreview(t)}
                                                >
                                                    {playingTrackId === t.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                                </button>
                                                <span className="text-white text-sm font-medium">{i + 1}. {t.title}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/20">Ready</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm(`"${t.title}" track'ını silmek istediğinize emin misiniz?`)) {
                                                            setTracks(tracks.filter(track => track.id !== t.id));
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                                                    title="Track'ı Sil"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-8 flex justify-between items-center">
                                        <Button variant="ghost" onClick={() => setCurrentStep(1)}>Back</Button>
                                        <div className="flex gap-4">
                                            {/* Allow adding more if not Single */}
                                            {releaseType !== 'Single' && (
                                                <label className="cursor-pointer">
                                                    <span className="h-[56px] px-8 rounded-full font-display font-bold text-[13px] tracking-wide transition-all duration-300 ease-wise-ease flex items-center justify-center bg-white/5 border-2 border-white/5 text-white hover:bg-white/10 hover:border-white/10">
                                                        <Plus size={16} className="mr-2" /> Add More
                                                    </span>
                                                    <input type="file" className="hidden" multiple accept="audio/*" onChange={handleAudioUpload} />
                                                </label>
                                            )}
                                            <Button variant="accent" onClick={() => setCurrentStep(3)}>Next: Edit Details</Button>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Step 3: Track Details */}
                    {currentStep === 3 && (
                        <div className="relative min-h-[600px]">
                            {uploadProgress !== null ? (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                                    <style>{`
                                        @keyframes shimmer {
                                            100% { transform: translateX(100%); }
                                        }
                                    `}</style>
                                    <Card className="py-16 flex flex-col items-center justify-center text-center w-full max-w-xl border-indigo-500/30 shadow-2xl shadow-indigo-500/10 bg-[#0A0A12]">
                                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                            <UploadCloud size={32} className="text-indigo-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2 font-display">Uploading Track...</h3>
                                        <div className="w-full max-w-sm space-y-3 mt-4">
                                            <div className="flex justify-between text-xs text-gray-400 font-mono uppercase tracking-widest">
                                                <span>Processing Audio</span>
                                                <span>{Math.round(uploadProgress)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all duration-300 ease-out relative overflow-hidden"
                                                    style={{ width: `${uploadProgress}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full -translate-x-full animate-[shimmer_1s_infinite]" />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-indigo-300/60 animate-pulse mt-6">
                                            Analyzing waveform & metadata...
                                        </p>
                                    </Card>
                                </div>
                            ) : (
                                <div className="animate-fade-in flex flex-col gap-8">
                                    <Card className="min-h-[600px] flex flex-col">
                                        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                                            <h2 className="text-2xl font-bold font-display text-white">Track List</h2>
                                            <div className="flex items-center gap-4">
                                                <Button variant="secondary" onClick={handleSaveDraft} className="h-10 px-4 text-xs border-dashed border-white/20">
                                                    <Save size={14} className="mr-2" /> Save & Exit
                                                </Button>
                                                {!isEditingExisting && (
                                                    <label className="cursor-pointer">
                                                        <span className="flex items-center justify-center bg-[#6366f1] text-white hover:bg-[#5558e6] shadow-lg shadow-indigo-500/30 border-2 border-transparent h-10 px-6 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-wise-ease">
                                                            <Plus size={16} className="mr-2" /> Add Track
                                                        </span>
                                                        <input type="file" className="hidden" multiple accept="audio/*" onChange={handleAudioUpload} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {tracks.length === 0 && (
                                                <div className="text-center py-12 text-white/30 border border-dashed border-white/10 rounded-3xl">
                                                    No tracks added yet. Click 'Add Track' to begin.
                                                </div>
                                            )}
                                            {tracks.map((track, i) => (
                                                <div key={track.id} className={`rounded-[30px] border transition-all duration-300 ${editingTrackId === track.id ? 'bg-[#15151A] border-indigo-500/50 shadow-2xl shadow-black/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                                    <div
                                                        className="p-6 flex items-center justify-between cursor-pointer"
                                                        onClick={() => toggleTrackEdit(track.id)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                                                                {i + 1}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${playingTrackId === track.id ? 'bg-green-500 text-black shadow-green-500/20 scale-110' : 'bg-white text-black hover:bg-gray-200 hover:scale-105'}`}
                                                                onClick={(e) => { e.stopPropagation(); handlePlayPreview(track); }}
                                                            >
                                                                {playingTrackId === track.id ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                                                            </button>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-white font-display">{track.title}</h3>
                                                                <p className="text-xs text-white/50">{track.artists.map(a => a.name).join(', ')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteTrack(track.id);
                                                                }}
                                                                className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                                                                title="Track'ı Sil"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <div className={`p-2 rounded-full transition-transform duration-300 ${editingTrackId === track.id ? 'rotate-180 bg-white/10 text-white' : 'text-white/30'}`}>
                                                                <ChevronDown size={20} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {editingTrackId === track.id && (
                                                        <div className="p-8 pt-0 border-t border-white/5 animate-fade-in">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                                <div className="col-span-2">
                                                                    <Input label="Track Title" value={track.title} onChange={e => handleUpdateTrack(track.id, { title: e.target.value })} />
                                                                </div>
                                                                <Select
                                                                    label="Version"
                                                                    options={[{ value: '', label: 'Original Mix' }, { value: 'Radio Edit', label: 'Radio Edit' }, { value: 'Remix', label: 'Remix' }, { value: 'Live', label: 'Live' }]}
                                                                    value={track.version || ''}
                                                                    onChange={e => handleUpdateTrack(track.id, { version: e.target.value })}
                                                                />
                                                                {/* Per Track Genre */}
                                                                <Select label="Genre" options={GENRES.map(g => ({ value: g, label: g }))} value={track.genre || ''} onChange={e => handleUpdateTrack(track.id, { genre: e.target.value })} />
                                                                <Input label="Sub-Genre" value={track.subGenre || ''} onChange={e => handleUpdateTrack(track.id, { subGenre: e.target.value })} />

                                                                <Input label="ISRC Code" placeholder="Auto-generate if empty" value={track.isrc || ''} onChange={e => handleUpdateTrack(track.id, { isrc: e.target.value })} disabled={isEditingExisting && !!track.isrc} />
                                                                <Select
                                                                    label="Language"
                                                                    options={LANGUAGES.map(l => ({ value: l, label: l }))}
                                                                    value={track.language}
                                                                    onChange={e => handleUpdateTrack(track.id, { language: e.target.value })}
                                                                />
                                                                <Select
                                                                    label="Explicit Content"
                                                                    options={[{ value: 'false', label: 'Clean / No Lyrics' }, { value: 'true', label: 'Explicit' }]}
                                                                    value={String(track.isExplicit)}
                                                                    onChange={e => handleUpdateTrack(track.id, { isExplicit: e.target.value === 'true' })}
                                                                />
                                                                {/* Instrumental & Content Ownership */}
                                                                <div className="flex flex-col gap-4 bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                                                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleUpdateTrack(track.id, { isInstrumental: !track.isInstrumental })}>
                                                                        <div>
                                                                            <span className="text-sm text-white font-bold block">Instrumental</span>
                                                                            <span className="text-xs text-[#888]">No lyrics / vocals (Skips Lyricist check)</span>
                                                                        </div>
                                                                        <div className={`w-10 h-6 rounded-full relative transition-colors ${track.isInstrumental ? 'bg-green-500' : 'bg-gray-600'}`}>
                                                                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${track.isInstrumental ? 'translate-x-4' : 'translate-x-0'}`} />
                                                                        </div>
                                                                    </div>

                                                                    <div className="pt-4 border-t border-white/10">
                                                                        <span className="text-xs font-bold text-white/60 block mb-2 uppercase tracking-wider">Content Ownership</span>
                                                                        <div className="flex flex-col gap-2">
                                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`contentType-${track.id}`}
                                                                                    checked={track.copyrightType !== 'Licensed'}
                                                                                    onChange={() => handleUpdateTrack(track.id, { copyrightType: 'Original' })}
                                                                                    className="accent-indigo-500"
                                                                                />
                                                                                <span className="text-white text-sm">100% Original (My Content)</span>
                                                                            </label>
                                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`contentType-${track.id}`}
                                                                                    checked={track.copyrightType === 'Licensed'}
                                                                                    onChange={() => handleUpdateTrack(track.id, { copyrightType: 'Licensed' })}
                                                                                    className="accent-indigo-500"
                                                                                />
                                                                                <span className="text-white text-sm">Contains Samples (License Required)</span>
                                                                            </label>
                                                                        </div>
                                                                        {track.copyrightType === 'Licensed' && (
                                                                            <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                                                                                <AlertTriangle size={12} /> Verification docs required in Step 5.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Artists Section */}
                                                            <div
                                                                className={`mt-8 bg-black/20 rounded-3xl p-6 border transition-all duration-500 ${highlightError === 'producer' ? 'border-red-500 ring-2 ring-red-500/50 animate-pulse' : 'border-white/5'}`}
                                                                id="artists-section"
                                                            >
                                                                {highlightError === 'producer' && (
                                                                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-xl flex items-center gap-2">
                                                                        <AlertOctagon size={20} className="text-red-400 shrink-0" />
                                                                        <span className="text-sm text-red-300">Add at least one "Producer" to continue!</span>
                                                                        <button className="ml-auto text-red-400 hover:text-white" onClick={() => setHighlightError(null)}>✕</button>
                                                                    </div>
                                                                )}
                                                                <h4 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4">Artists & Performers</h4>
                                                                {track.artists.map((artist, idx) => (
                                                                    <div key={artist.id} className="mb-6 pb-6 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                                                                        {/* Row 1: Artist Name + Save Button */}
                                                                        <div className="flex gap-3 mb-4 items-end">
                                                                            <div className="flex-1 relative">
                                                                                <Input
                                                                                    label="Artist / Stage Name"
                                                                                    placeholder="Search library or type new..."
                                                                                    value={artist.name}
                                                                                    onChange={e => handleArtistNameChange(track.id, idx, e.target.value)}
                                                                                    autoComplete="off"
                                                                                />
                                                                                {artist.name && artistLibrary.filter(a => a.name.toLowerCase().includes(artist.name.toLowerCase()) && a.name.toLowerCase() !== artist.name.toLowerCase()).length > 0 && (
                                                                                    <div className="absolute z-50 w-full bg-[#1A1A1A] border border-[#333] rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                                                                                        {artistLibrary.filter(a => a.name.toLowerCase().includes(artist.name.toLowerCase())).slice(0, 5).map(a => (
                                                                                            <button
                                                                                                key={a.id}
                                                                                                type="button"
                                                                                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm flex flex-col"
                                                                                                onClick={() => {
                                                                                                    handleUpdateArtist(track.id, idx, {
                                                                                                        name: a.name,
                                                                                                        legalName: a.legalName,
                                                                                                        spotifyUrl: a.spotifyUrl,
                                                                                                        appleId: a.appleId
                                                                                                    });
                                                                                                }}
                                                                                            >
                                                                                                <span className="font-medium">{a.name}</span>
                                                                                                {a.legalName && <span className="text-xs text-[#666]">Legal: {a.legalName}</span>}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <Button
                                                                                variant="secondary"
                                                                                className="h-[60px] w-[60px] px-0 mb-5 shrink-0"
                                                                                title="Save to Library"
                                                                                onClick={() => saveArtistToLibrary(artist)}
                                                                            >
                                                                                <Save size={20} />
                                                                            </Button>
                                                                        </div>
                                                                        {/* Row 2: Role + Legal Name + Spotify */}
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                            <Select
                                                                                label="Role"
                                                                                options={[
                                                                                    { value: 'Primary Artist', label: 'Primary Artist' },
                                                                                    { value: 'Featured', label: 'Featured Artist' },
                                                                                    { value: 'Remixer', label: 'Remixer' },
                                                                                    { value: 'Producer', label: 'Producer' },
                                                                                    { value: 'Contributor', label: 'Contributor' }
                                                                                ]}
                                                                                value={artist.role}
                                                                                onChange={e => handleUpdateArtist(track.id, idx, { role: e.target.value as any })}
                                                                            />
                                                                            <Input
                                                                                label="Legal Name (Optional)"
                                                                                placeholder="e.g. Jacques Webster"
                                                                                value={artist.legalName || ''}
                                                                                onChange={e => handleUpdateArtist(track.id, idx, { legalName: e.target.value })}
                                                                            />
                                                                            <Input
                                                                                label="Spotify Artist URL (Optional)"
                                                                                placeholder="https://open.spotify.com/artist/..."
                                                                                value={artist.spotifyUrl || ''}
                                                                                onChange={e => handleUpdateArtist(track.id, idx, { spotifyUrl: e.target.value })}
                                                                            />
                                                                        </div>
                                                                        <Button variant="danger" className="mt-4 h-10 text-xs" onClick={() => handleRemoveArtist(track.id, idx)}>
                                                                            <Trash2 size={14} className="mr-2" /> Remove Artist
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                                <Button variant="secondary" onClick={() => handleAddArtist(track.id)} className="w-full h-12 text-sm mt-2 border-dashed border-white/20">
                                                                    + Add Artist / Performer
                                                                </Button>
                                                            </div>

                                                            {/* Writers Section - Composers, Lyricists, Songwriters */}
                                                            <div
                                                                className={`mt-8 bg-purple-900/10 rounded-3xl p-6 border transition-all duration-500 ${highlightError === 'writer' ? 'border-red-500 ring-2 ring-red-500/50 animate-pulse' : 'border-purple-500/20'}`}
                                                                id="writers-section"
                                                            >
                                                                {highlightError === 'writer' && (
                                                                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-xl flex items-center gap-2">
                                                                        <AlertOctagon size={20} className="text-red-400 shrink-0" />
                                                                        <span className="text-sm text-red-300">Add at least one Songwriter/Composer with name to continue!</span>
                                                                        <button className="ml-auto text-red-400 hover:text-white" onClick={() => setHighlightError(null)}>✕</button>
                                                                    </div>
                                                                )}
                                                                <h4 className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-4">Songwriters & Composers</h4>
                                                                <p className="text-xs text-purple-200/60 mb-4">Add everyone who wrote the lyrics or composed the music.</p>

                                                                {(track.writers || []).map((writer: any, wIdx: number) => (
                                                                    <div key={writer.id} className="mb-4 pb-4 border-b border-purple-500/10 last:border-0">
                                                                        <div className="grid grid-cols-12 gap-4 items-end">
                                                                            {/* Role */}
                                                                            <div className="col-span-12 md:col-span-3">
                                                                                <Select
                                                                                    label="Role"
                                                                                    options={[
                                                                                        { value: 'Songwriter', label: 'Songwriter' },
                                                                                        { value: 'Composer', label: 'Composer (Music)' },
                                                                                        { value: 'Lyricist', label: 'Lyricist (Lyrics)' }
                                                                                    ]}
                                                                                    value={writer.role}
                                                                                    onChange={e => {
                                                                                        const newWriters = [...(track.writers || [])];
                                                                                        newWriters[wIdx] = { ...newWriters[wIdx], role: e.target.value };
                                                                                        handleUpdateTrack(track.id, { writers: newWriters });
                                                                                    }}
                                                                                />
                                                                            </div>

                                                                            {/* Legal Name */}
                                                                            <div className="col-span-12 md:col-span-5 relative">
                                                                                <Input
                                                                                    label="Full Legal Name"
                                                                                    placeholder="e.g. John Smith"
                                                                                    value={writer.legalName || writer.name || ''}
                                                                                    onChange={e => {
                                                                                        const newWriters = [...(track.writers || [])];
                                                                                        newWriters[wIdx] = { ...newWriters[wIdx], legalName: e.target.value, name: e.target.value };
                                                                                        handleUpdateTrack(track.id, { writers: newWriters });
                                                                                    }}
                                                                                    autoComplete="off"
                                                                                />
                                                                                {/* Dropdown Logic */}
                                                                                {(writer.name || writer.legalName) && writerLibrary.filter(w => w.name.toLowerCase().includes((writer.name || writer.legalName || '').toLowerCase()) && w.name.toLowerCase() !== (writer.name || writer.legalName || '').toLowerCase()).length > 0 && (
                                                                                    <div className="absolute z-50 w-full bg-[#1A1A1A] border border-[#333] rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                                                                                        {writerLibrary.filter(w => w.name.toLowerCase().includes((writer.name || writer.legalName || '').toLowerCase())).slice(0, 5).map(w => (
                                                                                            <button
                                                                                                key={w.id}
                                                                                                type="button"
                                                                                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm flex flex-col"
                                                                                                onClick={() => {
                                                                                                    const newWriters = [...(track.writers || [])];
                                                                                                    newWriters[wIdx] = { ...newWriters[wIdx], name: w.name, legalName: w.legalName || w.name, role: w.role || 'Songwriter' };
                                                                                                    handleUpdateTrack(track.id, { writers: newWriters });
                                                                                                }}
                                                                                            >
                                                                                                <span className="font-medium">{w.name}</span>
                                                                                                <span className="text-xs text-[#666]">{w.role}</span>
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Share % */}
                                                                            <div className="col-span-6 md:col-span-2">
                                                                                <Input
                                                                                    label="Share %"
                                                                                    type="number"
                                                                                    placeholder="50"
                                                                                    value={writer.share || ''}
                                                                                    onChange={e => {
                                                                                        const newWriters = [...(track.writers || [])];
                                                                                        newWriters[wIdx] = { ...newWriters[wIdx], share: parseInt(e.target.value) || 0 };
                                                                                        handleUpdateTrack(track.id, { writers: newWriters });
                                                                                    }}
                                                                                />
                                                                            </div>

                                                                            {/* Actions */}
                                                                            <div className="col-span-6 md:col-span-2 flex gap-2 mb-5">
                                                                                <Button
                                                                                    variant="secondary"
                                                                                    className="h-[60px] flex-1 px-0"
                                                                                    title="Save to Library"
                                                                                    onClick={() => saveWriterToLibrary(writer)}
                                                                                >
                                                                                    <Save size={20} />
                                                                                </Button>
                                                                                <Button variant="danger" className="h-[60px] flex-1 px-0" onClick={() => {
                                                                                    const newWriters = (track.writers || []).filter((_: any, i: number) => i !== wIdx);
                                                                                    handleUpdateTrack(track.id, { writers: newWriters });
                                                                                }}>
                                                                                    <Trash2 size={20} />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                <Button variant="secondary" className="w-full h-12 text-sm border-dashed border-purple-500/30 text-purple-300" onClick={() => {
                                                                    const newWriter = { id: `writer-${Date.now()}`, name: '', legalName: '', role: 'Songwriter', share: 100 };
                                                                    handleUpdateTrack(track.id, { writers: [...(track.writers || []), newWriter] });
                                                                }}>
                                                                    + Add Songwriter / Composer
                                                                </Button>
                                                            </div>

                                                            <div className="mt-8 p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-3xl">
                                                                <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">Rights & AI</h4>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <Select
                                                                        label="Composition"
                                                                        options={[{ value: 'Original', label: 'Original Composition' }, { value: 'Cover', label: 'Cover Song' }]}
                                                                        value={track.compositionType}
                                                                        onChange={e => handleUpdateTrack(track.id, { compositionType: e.target.value as any })}
                                                                    />
                                                                    <Select
                                                                        label="AI Usage"
                                                                        options={[{ value: 'None', label: 'No AI Used' }, { value: 'Partial', label: 'AI Assisted' }, { value: 'Full', label: 'Fully AI Generated' }]}
                                                                        value={track.aiUsage}
                                                                        onChange={e => handleUpdateTrack(track.id, { aiUsage: e.target.value as any })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto pt-8 flex justify-end">
                                            <Button variant="accent" onClick={validateTracks}>Next: Metadata</Button>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Metadata */}
                    {currentStep === 4 && (
                        <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
                            <Card>
                                <div className="flex justify-between items-start mb-8">
                                    <h2 className="text-2xl font-bold font-display text-white">Release Information</h2>
                                    <Button variant="secondary" onClick={handleSaveDraft} className="h-10 px-4 text-xs border-dashed border-white/20">
                                        <Save size={14} className="mr-2" /> Save & Exit
                                    </Button>
                                </div>

                                <Input
                                    label="Main Release Artist"
                                    placeholder="Primary Artist for the Album/Single"
                                    value={mainArtist}
                                    onChange={e => setMainArtist(e.target.value)}
                                />

                                <Input label="Release Title" value={releaseTitle} onChange={e => setReleaseTitle(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Select label="Genre" options={GENRES.map(g => ({ value: g, label: g }))} value={genre} onChange={e => setGenre(e.target.value)} />
                                    <Input label="Sub-Genre" value={subGenre} onChange={e => setSubGenre(e.target.value)} />
                                </div>
                                <div className="mt-8 border-t border-white/10 pt-8">
                                    <h4 className="text-sm font-bold text-white mb-4">Copyrights & Dates</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="© Year" value={cYear} onChange={e => setCYear(e.target.value)} />
                                        <Input label="© Composition Owner" value={cLine} onChange={e => setCLine(e.target.value)} />
                                        <Input label="℗ Year" value={pYear} onChange={e => setPYear(e.target.value)} />
                                        <Input label="℗ Master Owner" value={pLine} onChange={e => setPLine(e.target.value)} />
                                    </div>
                                    <Input label="Record Label Name" value={recordLabel} onChange={e => setRecordLabel(e.target.value)} />

                                    <div className="flex items-center gap-2 mb-4 mt-4">
                                        <input
                                            type="checkbox"
                                            id="distributedBefore"
                                            checked={distributedBefore}
                                            onChange={e => setDistributedBefore(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-600 bg-transparent text-indigo-500 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="distributedBefore" className="text-sm text-white font-medium select-none cursor-pointer">
                                            This release has been distributed before?
                                        </label>
                                    </div>

                                    {distributedBefore && (
                                        <div className="grid grid-cols-2 gap-4 animate-fade-in bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                                            <div className="col-span-2 text-xs text-yellow-500 mb-2">
                                                Please enter the Original Release Date and original identifiers. Ensure tracks have ISRCs in Track Details if available.
                                            </div>
                                            <Input
                                                label="Original Release Date"
                                                type="date"
                                                value={originalReleaseDate}
                                                onChange={e => setOriginalReleaseDate(e.target.value)}
                                            />
                                            <Input
                                                label="UPC / EAN Code"
                                                value={upc}
                                                onChange={e => setUpc(e.target.value)}
                                                placeholder="Original UPC"
                                                disabled={isEditingExisting && !!originalUpc}
                                            />
                                        </div>
                                    )}
                                    {!distributedBefore && (
                                        <Input label="UPC / EAN Code (Optional)" value={upc} onChange={e => setUpc(e.target.value)} placeholder="Leave blank for auto-generation" disabled={isEditingExisting && !!originalUpc} />
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <FileText size={16} /> Legal Documents
                                    </h4>
                                    <p className="text-xs text-[#888] mb-4">Upload contracts, ID, or rights proof (PDF/JPG) - Required if using samples.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {documents.map((doc, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                                                <span className="text-xs truncate text-white">{doc.split('/').pop()}</span>
                                                <Button variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => setDocuments(docs => docs.filter((_, idx) => idx !== i))}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        ))}
                                        <div className="relative border border-dashed border-[#333] hover:border-[#666] rounded flex flex-col items-center justify-center p-4 transition-colors bg-white/5">
                                            {docUploadProgress !== null ? (
                                                <div className="w-full px-4 text-center">
                                                    <span className="text-xs text-[#888] mb-2 block">Uploading...</span>
                                                    <div className="w-full bg-[#333] h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${docUploadProgress}%` }} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <UploadCloud className="text-[#666] mb-2" size={20} />
                                                    <span className="text-xs text-[#666]">Upload Document</span>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.png"
                                                        onChange={handleDocumentUpload}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <div className="flex justify-between">
                                <Button variant="ghost" onClick={() => setCurrentStep(3)}>Back</Button>
                                <Button variant="accent" onClick={() => setCurrentStep(5)}>Next: Artwork</Button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Artwork */}
                    {currentStep === 5 && (
                        <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
                            <Card>
                                <h2 className="text-2xl font-bold font-display text-white mb-2">Cover Art</h2>
                                <div className="border border-dashed border-white/20 hover:border-indigo-500/50 rounded-[3rem] p-16 flex flex-col items-center justify-center bg-white/5 transition-all">
                                    {coverUrl ? (
                                        <div className="relative group">
                                            <img src={coverUrl} className="w-64 h-64 rounded-xl shadow-2xl mx-auto md:mx-0 object-cover border border-white/10" />
                                            <button className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10" onClick={() => setCoverUrl(null)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : coverUploadProgress !== null ? (
                                        <div className="w-64 text-center">
                                            <div className="mb-4 relative w-16 h-16 mx-auto">
                                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="8" />
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="8"
                                                        strokeDasharray="283"
                                                        strokeDashoffset={283 - (283 * coverUploadProgress) / 100}
                                                        transform="rotate(-90 50 50)"
                                                        className="transition-all duration-200 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                    {Math.round(coverUploadProgress)}%
                                                </div>
                                            </div>
                                            <p className="text-sm text-white/50">Uploading Artwork...</p>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center">
                                            <input
                                                type="file"
                                                accept="image/*,.jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={handleCoverStart}
                                            />
                                            <ImageIcon size={64} className="text-white/20 mb-6" />
                                            <span className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors">Select Image</span>
                                            <p className="text-xs text-white/40 mt-4">3000x3000 recommended, JPG or PNG</p>
                                        </label>
                                    )}
                                </div>
                            </Card>
                            <div className="flex justify-between">
                                <Button variant="ghost" onClick={() => setCurrentStep(4)}>Back</Button>
                                <Button variant="accent" onClick={() => setCurrentStep(6)} disabled={!coverUrl}>Next: Stores</Button>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Stores */}
                    {currentStep === 6 && (
                        <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
                            <Card>
                                <h2 className="text-2xl font-bold font-display text-white mb-8">Distribution Strategy</h2>
                                <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Calendar size={18} /> Release Date</h3>

                                    <div className="flex gap-6 mb-6">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="releaseTiming"
                                                value="ASAP"
                                                checked={releaseTiming === 'ASAP'}
                                                onChange={() => { setReleaseTiming('ASAP'); setReleaseDate(minDate.toISOString().split('T')[0]); }}
                                                className="w-5 h-5 accent-indigo-500"
                                            />
                                            <div>
                                                <span className="text-white font-bold block text-sm">As Soon As Possible</span>
                                                <span className="text-white/40 text-xs">Usually within 24-48 hours</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="releaseTiming"
                                                value="Specific"
                                                checked={releaseTiming === 'Specific'}
                                                onChange={() => setReleaseTiming('Specific')}
                                                className="w-5 h-5 accent-indigo-500"
                                            />
                                            <div>
                                                <span className="text-white font-bold block text-sm">Specific Date</span>
                                                <span className="text-white/40 text-xs">Pre-order / Scheduled</span>
                                            </div>
                                        </label>
                                    </div>

                                    {releaseTiming === 'Specific' && (
                                        <div className="animate-fade-in mt-4">
                                            <label className="block text-xs text-white/60 mb-2 uppercase font-bold tracking-wider">Select Date</label>
                                            <Input
                                                type="date"
                                                min={minDate.toISOString().split('T')[0]}
                                                value={releaseDate}
                                                onChange={e => setReleaseDate(e.target.value)}
                                            />
                                            <p className="text-xs text-yellow-500/80 mt-2 flex items-center gap-2">
                                                <AlertTriangle size={12} /> must be at least 20 days in future for optimum pitching
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-white font-bold flex items-center gap-2"><Globe size={18} /> Platforms</h3>
                                        <div className="flex gap-2">
                                            <button
                                                className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors"
                                                onClick={() => setSelectedStores(STORES.map(s => s.id))}
                                            >
                                                Select All
                                            </button>
                                            <button
                                                className="text-[10px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                                                onClick={() => setSelectedStores([])}
                                            >
                                                None
                                            </button>
                                        </div>
                                    </div>

                                    {/* Top 4 Major Platforms with Logos + More Button */}
                                    <div className="grid grid-cols-5 gap-3 mb-4">
                                        {STORES.slice(0, 4).map(store => (
                                            <label key={store.id} className={`flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all ${selectedStores.includes(store.id) ? 'bg-indigo-500/20 border-2 border-indigo-500' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStores.includes(store.id)}
                                                    onChange={() => {
                                                        if (selectedStores.includes(store.id)) {
                                                            setSelectedStores(selectedStores.filter(s => s !== store.id));
                                                        } else {
                                                            setSelectedStores([...selectedStores, store.id]);
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                    {store.logo ? (
                                                        <img src={store.logo} alt={store.name} className="w-6 h-6" />
                                                    ) : (
                                                        <Globe size={20} className="text-white/50" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-white/80 font-medium text-center leading-tight">{store.name.split('(')[0].trim()}</span>
                                                {selectedStores.includes(store.id) && <span className="text-[8px] text-indigo-400">✓</span>}
                                            </label>
                                        ))}

                                        {/* +More Button as 5th item */}
                                        <button
                                            onClick={() => setShowAllPlatforms(true)}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 hover:bg-white/10 hover:border-indigo-500/50 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                                <span className="text-indigo-400 font-bold text-sm">+{STORES.length - 4}</span>
                                            </div>
                                            <span className="text-[10px] text-white/60 font-medium">More</span>
                                        </button>
                                    </div>

                                    {/* Selected Count */}
                                    <p className="text-xs text-[#888] text-center">
                                        {selectedStores.length} of {STORES.length} platforms selected
                                    </p>

                                    {/* All Platforms Modal */}
                                    {showAllPlatforms && (
                                        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAllPlatforms(false)}>
                                            <div className="bg-[#111] border border-[#333] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                                                <div className="sticky top-0 bg-[#111] p-6 border-b border-[#333] flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">All Distribution Platforms</h3>
                                                        <p className="text-sm text-[#888]">{selectedStores.length} selected</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setSelectedStores(STORES.map(s => s.id))} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-full">Select All</button>
                                                        <button onClick={() => setShowAllPlatforms(false)} className="text-[#888] hover:text-white text-2xl">&times;</button>
                                                    </div>
                                                </div>
                                                <div className="p-6 overflow-y-auto max-h-[60vh]">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {STORES.map(store => (
                                                            <label key={store.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedStores.includes(store.id) ? 'bg-indigo-500/20 border border-indigo-500' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedStores.includes(store.id)}
                                                                    onChange={() => {
                                                                        if (selectedStores.includes(store.id)) {
                                                                            setSelectedStores(selectedStores.filter(s => s !== store.id));
                                                                        } else {
                                                                            setSelectedStores([...selectedStores, store.id]);
                                                                        }
                                                                    }}
                                                                    className="accent-indigo-500 w-4 h-4"
                                                                />
                                                                <span className="text-xs text-white/90 font-medium">{store.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="p-6 border-t border-[#333]">
                                                    <button onClick={() => setShowAllPlatforms(false)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-full font-bold">Done ({selectedStores.length} selected)</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content ID Section */}
                                <div className="mb-8 p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-3xl">
                                    <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Lock size={18} /> Content ID & Monetization</h3>

                                    {monetization.youtubeContentId && (
                                        <div className="p-3 bg-red-900/20 border border-red-500/20 rounded mb-4">
                                            <div className="flex gap-2">
                                                <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-400">Strict Content ID Policy</p>
                                                    <p className="text-[10px] text-red-300/80">
                                                        If your release contains ANY AI-generated content, loops, or non-exclusive samples, YouTube will REJECT it and may strike your account. Only enable Content ID for 100% original, human-created music.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-yellow-400/80 mb-4 flex items-center gap-2">
                                        <AlertTriangle size={14} />
                                        If your track contains 3rd-party samples or covers, you may not be eligible for Content ID.
                                    </p>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                                            <input
                                                type="checkbox"
                                                checked={monetization.youtubeContentId}
                                                onChange={() => setMonetization({ ...monetization, youtubeContentId: !monetization.youtubeContentId })}
                                                className="accent-indigo-500 w-4 h-4"
                                            />
                                            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-sm text-white font-medium block">YouTube Content ID</span>
                                                <span className="text-xs text-[#888]">Claim revenue from YouTube videos using your music</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                                            <input
                                                type="checkbox"
                                                checked={monetization.tikTok}
                                                onChange={() => setMonetization({ ...monetization, tikTok: !monetization.tikTok })}
                                                className="accent-indigo-500 w-4 h-4"
                                            />
                                            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="url(#tiktok-gradient)" /><defs><linearGradient id="tiktok-gradient" x1="5" y1="2" x2="19.59" y2="20.1"><stop stopColor="#00f2ea" /><stop offset="1" stopColor="#ff0050" /></linearGradient></defs></svg>
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-sm text-white font-medium block">TikTok Creator Earnings</span>
                                                <span className="text-xs text-[#888]">Earn from TikTok videos using your sound</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                                            <input
                                                type="checkbox"
                                                checked={monetization.facebook}
                                                onChange={() => setMonetization({ ...monetization, facebook: !monetization.facebook })}
                                                className="accent-indigo-500 w-4 h-4"
                                            />
                                            <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-sm text-white font-medium block">Facebook Monetization</span>
                                                <span className="text-xs text-[#888]">Earn from Facebook/Instagram stories & reels</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                                            <input
                                                type="checkbox"
                                                checked={monetization.instagram}
                                                onChange={() => setMonetization({ ...monetization, instagram: !monetization.instagram })}
                                                className="accent-indigo-500 w-4 h-4"
                                            />
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] flex items-center justify-center flex-shrink-0">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-sm text-white font-medium block">Instagram Content ID</span>
                                                <span className="text-xs text-[#888]">Protect your charts on Instagram</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </Card>
                            <div className="flex justify-between">
                                <Button variant="ghost" onClick={() => setCurrentStep(4)}>Back</Button>
                                <Button variant="accent" onClick={() => setCurrentStep(7)}>Review</Button>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Review & Submit */}
                    {currentStep === 7 && (
                        <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-12">
                            {(() => {
                                const errors: string[] = [];

                                // Validate Producers
                                const hasProducer = tracks.every(t => t.artists.some(a => a.role === 'Producer'));
                                if (!hasProducer) errors.push('Every track must have at least one "Producer" listed in artists.');

                                // Validate Songwriters (At least 1 writer if NOT Instrumental)
                                const invalidWriters = tracks.some(t => !t.isInstrumental && (!t.writers || t.writers.length === 0 || t.writers.some(w => !w.name || !w.role)));
                                if (invalidWriters) errors.push('Non-instrumental tracks must have at least one Songwriter/Composer/Lyricist.');

                                // Validate Sample Clearance (If Licensed)
                                const needsDocs = tracks.some(t => t.copyrightType === 'Licensed');
                                if (needsDocs && (!documents || documents.length === 0)) {
                                    errors.push('You selected "Contains Samples" for a track. You MUST upload clearance documents in Step 5.');
                                }

                                // Legal Name Check (General)
                                const missingLegal = tracks.some(t => t.artists.some(a => ['Primary Artist', 'Featured'].includes(a.role) && !a.legalName));
                                // Optional: strict legal name enforcement? The user said "Enforce at least 2 mandatory fields for Songwriter/Legal Name".
                                // I'll stick to the writer check above which enforces Name and Role.

                                if (errors.length > 0) {
                                    return (
                                        <div className="bg-red-900/10 border-2 border-red-500 rounded-3xl p-8 text-center mb-8">
                                            <AlertOctagon size={48} className="mx-auto text-red-500 mb-4" />
                                            <h2 className="text-2xl font-bold text-white mb-2">Almost there!</h2>
                                            <p className="text-red-200 mb-6">Please fix the following issues before submitting:</p>
                                            <div className="space-y-3 max-w-lg mx-auto">
                                                {errors.map((err, i) => (
                                                    <div key={i} className="flex items-center justify-between gap-4 p-3 bg-black/30 rounded-xl border border-red-500/30">
                                                        <span className="text-sm text-red-300 text-left">{err}</span>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 text-xs shrink-0 border border-red-500/50 text-red-400 hover:bg-red-500/20"
                                                            onClick={() => {
                                                                // Set highlight based on error type
                                                                if (err.includes('Producer')) {
                                                                    setHighlightError('producer');
                                                                } else if (err.includes('Songwriter') || err.includes('Composer')) {
                                                                    setHighlightError('writer');
                                                                }
                                                                setCurrentStep(2);
                                                                // Scroll to top after a small delay
                                                                setTimeout(() => {
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }, 100);
                                                            }}
                                                        >
                                                            Fix →
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <Card className="bg-gradient-to-b from-indigo-900/40 to-black/40 border-indigo-500/20">
                                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                    <img src={coverUrl || 'https://via.placeholder.com/192x192?text=No+Cover'} className="w-48 h-48 rounded-3xl shadow-2xl shadow-black/50 border border-white/10 object-cover bg-[#222]" />
                                    <div className="text-center md:text-left flex-1">
                                        <Badge status={isEditingExisting ? "EDITING" : "DRAFT"} />
                                        <h1 className="text-4xl font-display font-bold text-white mt-4">{releaseTitle}</h1>
                                        <p className="text-white/60 text-lg mt-2">{user?.artistName}</p>
                                        <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                                            <span className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold text-[#CCC]">{releaseType}</span>
                                            <span className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold text-[#CCC]">{genre}</span>
                                            <span className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold text-[#CCC]">{tracks.length} Tracks</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Metadata Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <h3 className="text-white font-bold font-display mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                                        <FileText size={18} /> Release Details
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-white/50 shrink-0">Label</span>
                                            <span className="text-white font-medium text-right truncate max-w-[200px]" title={recordLabel || 'Independent'}>{recordLabel || 'Independent'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/50">UPC/EAN</span>
                                            <span className="text-white font-medium font-mono">{upc || 'Auto-Generated'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/50">Release Date</span>
                                            <span className="text-white font-medium">
                                                {releaseTiming === 'ASAP' ? 'ASAP (As Soon As Possible)' : releaseDate}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/50">Territory</span>
                                            <span className="text-white font-medium">{territory}</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="text-white font-bold font-display mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Copyright size={18} /> Rights & Legal
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-white/50 shrink-0">© Composition</span>
                                            <span className="text-white font-medium text-right truncate max-w-[200px]" title={`${cYear} ${cLine}`}>{cYear} {cLine}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-white/50 shrink-0">℗ Master</span>
                                            <span className="text-white font-medium text-right truncate max-w-[200px]" title={`${pYear} ${pLine}`}>{pYear} {pLine}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/50">Stores</span>
                                            <span className="text-white font-medium">{selectedStores.length} Selected</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Detailed Track Manifest */}
                            <Card className="p-0 overflow-hidden">
                                <div className="p-6 border-b border-white/10 bg-white/5">
                                    <h3 className="text-white font-bold font-display">Track Manifest</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {tracks.map((t, i) => (
                                        <div key={t.id} className="p-4 flex flex-col md:flex-row gap-4 md:items-center hover:bg-white/5 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50 shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-white">{t.title}</span>
                                                    {t.version && <span className="text-xs text-[#888] border border-white/10 px-1.5 rounded">{t.version}</span>}
                                                    {t.isExplicit && <span className="text-[10px] text-red-400 border border-red-900 px-1 rounded">E</span>}
                                                </div>
                                                <div className="text-xs text-white/50 mt-1">
                                                    {t.artists.map(a => `${a.name} (${a.role})`).join(', ')}
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:items-end gap-1 text-xs text-[#666]">
                                                <span className="font-mono">{t.isrc || 'ISRC: Auto'}</span>
                                                <span>{t.language} • {t.aiUsage} AI</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <div className="flex items-start gap-4 p-6 bg-indigo-900/10 rounded-[30px] border border-indigo-500/20">
                                <input
                                    type="checkbox"
                                    checked={confirmRights}
                                    onChange={(e) => setConfirmRights(e.target.checked)}
                                    className="mt-1 accent-indigo-500 w-5 h-5 rounded cursor-pointer"
                                    id="confirmRights"
                                />
                                <label htmlFor="confirmRights" className="text-sm text-white/70 leading-relaxed cursor-pointer select-none">
                                    I confirm that I possess 100% of the rights to distribute this release globally. I understand that fraudulent metadata or unauthorized samples will result in an immediate takedown and account suspension.
                                </label>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white/5 rounded-[30px] border border-white/10">
                                <input
                                    type="checkbox"
                                    checked={confirmAccuracy}
                                    onChange={(e) => setConfirmAccuracy(e.target.checked)}
                                    className="mt-1 accent-indigo-500 w-5 h-5 rounded cursor-pointer"
                                    id="confirmAccuracy"
                                />
                                <label htmlFor="confirmAccuracy" className="text-sm text-white/70 leading-relaxed cursor-pointer select-none">
                                    I confirm that all information provided (artist names, legal names, credits, metadata) is accurate and complete.
                                </label>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-amber-500/5 rounded-[30px] border border-amber-500/20">
                                <input
                                    type="checkbox"
                                    checked={confirmCommission}
                                    onChange={(e) => setConfirmCommission(e.target.checked)}
                                    className="mt-1 accent-amber-500 w-5 h-5 rounded cursor-pointer"
                                    id="confirmCommission"
                                />
                                <label htmlFor="confirmCommission" className="text-sm text-white/70 leading-relaxed cursor-pointer select-none">
                                    I understand and agree that WBBT Records will retain <strong className="text-amber-400">30% commission</strong> on all royalties earned from this release. This commission enables us to provide distribution services without upfront fees.
                                    <button type="button" onClick={() => setViewingContract('commission')} className="text-amber-400 underline ml-1 hover:text-amber-300">View Full Terms</button>
                                </label>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-red-500/5 rounded-[30px] border border-red-500/20">
                                <input
                                    type="checkbox"
                                    checked={confirmLiability}
                                    onChange={(e) => setConfirmLiability(e.target.checked)}
                                    className="mt-1 accent-red-500 w-5 h-5 rounded cursor-pointer"
                                    id="confirmLiability"
                                />
                                <label htmlFor="confirmLiability" className="text-sm text-white/70 leading-relaxed cursor-pointer select-none">
                                    I acknowledge that I am solely responsible for the content I submit. Any copyright infringement, bot/fake streaming, or illegal activity will result in account termination. Any penalties or fines incurred by WBBT Records due to my actions will be my responsibility.
                                    <button type="button" onClick={() => setViewingContract('liability')} className="text-red-400 underline ml-1 hover:text-red-300">View Full Agreement</button>
                                </label>
                            </div>

                            {/* Legal Contract Modals */}
                            {viewingContract && (
                                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingContract(null)}>
                                    <div className="bg-[#111] border border-[#333] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                        <div className="sticky top-0 bg-[#111] p-6 border-b border-[#333] flex justify-between items-center">
                                            <h3 className="text-xl font-bold text-white">
                                                {viewingContract === 'commission' ? 'Commission Agreement' : 'Liability & Terms of Service'}
                                            </h3>
                                            <button onClick={() => setViewingContract(null)} className="text-[#888] hover:text-white text-2xl">&times;</button>
                                        </div>
                                        <div className="p-6 text-sm text-[#CCC] leading-relaxed space-y-4">
                                            {viewingContract === 'commission' ? (
                                                <>
                                                    <h4 className="text-white font-bold">WBBT RECORDS - COMMISSION AGREEMENT</h4>
                                                    <p>By submitting your release through WBBT Records, you agree to the following commission structure:</p>
                                                    <ul className="list-disc pl-6 space-y-2">
                                                        <li><strong>Commission Rate:</strong> WBBT Records retains 30% (thirty percent) of all royalties earned from streaming platforms, download stores, and other distribution channels.</li>
                                                        <li><strong>Artist Share:</strong> You, the artist, will receive 70% (seventy percent) of all royalties after platform fees.</li>
                                                        <li><strong>Payment Schedule:</strong> Royalties are reported 2-3 months after the earning period and credited to your account balance.</li>
                                                        <li><strong>Minimum Withdrawal:</strong> The minimum withdrawal amount is $50 USD.</li>
                                                        <li><strong>No Upfront Fees:</strong> This commission model allows us to offer distribution services without subscription fees or upfront costs.</li>
                                                    </ul>
                                                    <p className="text-[#888] text-xs mt-4">This agreement is effective upon release submission and remains in effect for the duration of distribution.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <h4 className="text-white font-bold">WBBT RECORDS - LIABILITY & TERMS OF SERVICE</h4>
                                                    <p><strong>1. Content Responsibility:</strong> You are solely responsible for all content you submit. You warrant that you own or have proper licenses for all materials including audio, artwork, and metadata.</p>
                                                    <p><strong>2. Copyright Infringement:</strong> Submitting copyrighted material without authorization will result in immediate release takedown and account suspension. Repeated violations will result in permanent account termination.</p>
                                                    <p><strong>3. Bot/Fake Streaming:</strong> Any use of bots, fake streams, or artificial inflation of play counts is strictly prohibited. Discovery of such activity will result in:
                                                        <ul className="list-disc pl-6 mt-2">
                                                            <li>Immediate account termination</li>
                                                            <li>Forfeiture of all pending royalties</li>
                                                            <li>You will be held liable for any fines or penalties imposed on WBBT Records by platforms</li>
                                                        </ul></p>
                                                    <p><strong>4. Indemnification:</strong> You agree to indemnify and hold harmless WBBT Records from any claims, damages, or expenses arising from your content or actions.</p>
                                                    <p><strong>5. Account Termination:</strong> WBBT Records reserves the right to terminate accounts for violations of these terms. In cases of fraud or illegal activity, we may pursue legal action.</p>
                                                    <p><strong>6. Label vs Distributor:</strong> WBBT Records operates as a record label, not just a distributor. By releasing through us, you acknowledge this relationship.</p>
                                                    <p className="text-[#888] text-xs mt-4">By checking the agreement box, you acknowledge that you have read, understood, and agree to these terms.</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="p-6 border-t border-[#333]">
                                            <button onClick={() => setViewingContract(null)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-full font-bold">I Understand</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-8">
                                <Button variant="ghost" onClick={() => setCurrentStep(6)}>Back</Button>
                                <Button
                                    variant="accent"
                                    onClick={handleSubmit}
                                    disabled={submitting || !confirmRights || !confirmAccuracy || !confirmCommission || !confirmLiability}
                                    className={`bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 ${(!confirmRights || !confirmAccuracy || !confirmCommission || !confirmLiability) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? 'Processing...' : isEditingExisting ? 'Update Release' : 'Submit Release'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {trackToDelete && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                            <div className="bg-[#1A1A1A] border border-white/10 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-200">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={24} className="text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Delete Track?</h3>
                                <p className="text-gray-400 mb-6 text-sm">
                                    Are you sure you want to delete <span className="text-white font-medium">"{trackToDelete.title}"</span>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={cancelDelete}
                                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-lg shadow-red-600/20"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </div>
            </div>
        )
    );
};

export default ReleaseWizard;
