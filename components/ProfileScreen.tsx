



import React, { useContext, useMemo, useState, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ArrowLeft, ChefHat, BookOpen, Heart, Camera as CameraIcon, LogOut, Edit, Save, X, LoaderCircle, Check, Plus } from 'lucide-react';
import type { UserProfile, Child } from '../types';
import ChildEditCard from './ChildEditCard';
import ProductHistory from './ProductHistory';

const StatCard: React.FC<{ icon: React.ElementType, value: number | string, label: string }> = ({ icon: Icon, value, label }) => (
    <div className="bg-brand-surface p-3 rounded-xl shadow-sm text-center">
        <Icon className="mx-auto h-6 w-6 text-brand-primary mb-1.5" />
        <p className="text-2xl font-bold text-brand-text">{value}</p>
        <p className="text-xs text-brand-text-secondary font-semibold">{label}</p>
    </div>
);

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const ProfileScreen: React.FC = () => {
    const context = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>(context?.userProfile || {});
    const [editedName, setEditedName] = useState(context?.user?.displayName || '');
    const [newAvatar, setNewAvatar] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    
    if (!context || !context.user || !context.userProfile) return null;

    const { user, userProfile, pantry, mealLog, savedRecipes, feedPosts, setIsViewingProfile, updateUserProfile, updateUserAvatar, logout } = context;

    const userPostsCount = useMemo(() => {
        return feedPosts.filter(post => post.authorName === user.displayName).length;
    }, [feedPosts, user.displayName]);
    
    const handleEdit = () => {
        setEditedProfile(userProfile);
        setEditedName(user.displayName || '');
        setNewAvatar(null);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update Auth Profile (name and avatar)
            if (editedName.trim() !== user.displayName || newAvatar) {
                await updateUserAvatar(newAvatar || user.photoURL || '');
                if (editedName.trim() !== user.displayName) {
                    await context.updateUserProfile({ ...editedProfile, displayName: editedName.trim() });
                }
            }
            // Update Firestore Profile data
            await updateUserProfile(editedProfile);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
            setIsEditing(false);

        } catch(error) {
            console.error("Failed to save profile:", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const updateField = (field: keyof UserProfile, value: any) => {
        setEditedProfile(prev => ({...prev, [field]: value}));
    };
    
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const dataUrl = await fileToDataURL(file);
            setNewAvatar(dataUrl);
        }
    };
    
    // Child management handlers
    const handleAddChild = () => {
        const newChild: Child = { id: Date.now().toString(), name: '', age: 5, restrictions: { psychological: false, autism: false }, religiousDiets: [], otherReligiousDiet: '', medicalConditions: '', foodSelectivity: { level: 'medium', context: '' }, dislikedFoods: '' };
        updateField('children', [...(editedProfile.children || []), newChild]);
    };
    const handleRemoveChild = (id: string) => {
        updateField('children', (editedProfile.children || []).filter(c => c.id !== id));
    };
    const handleUpdateChild = (id: string, updates: Partial<Child>) => {
        updateField('children', (editedProfile.children || []).map(c => c.id === id ? { ...c, ...updates } : c));
    };

    return (
        <>
            <div className="fixed inset-0 bg-brand-background z-30 flex flex-col animate-fade-in">
                <header className="p-3 flex items-center justify-between border-b border-brand-border flex-shrink-0 bg-brand-surface/80 backdrop-blur-sm sticky top-0">
                    <button onClick={() => isEditing ? handleCancel() : setIsViewingProfile(false)} className="p-1.5 rounded-full hover:bg-gray-100">
                        {isEditing ? <X size={20} /> : <ArrowLeft size={20} />}
                    </button>
                    <h2 className="text-lg font-bold text-brand-text">Meu Perfil</h2>
                    <div className="w-8">
                        {!isEditing && <button onClick={handleEdit} className="p-1.5 rounded-full hover:bg-gray-100"><Edit size={20} /></button>}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-3">
                            <img src={newAvatar || user.photoURL || "/professor-nutri.png"} alt="User Avatar" className="h-24 w-24 rounded-full object-cover border-4 border-brand-surface shadow-lg" />
                            {isEditing && (
                                <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-brand-primary rounded-full text-white hover:bg-brand-dark transition-colors">
                                    <CameraIcon size={16} />
                                </button>
                            )}
                            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" />
                        </div>
                        {isEditing ? (
                            <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="text-2xl font-bold text-brand-text text-center bg-brand-background border-b-2 border-brand-primary p-1 w-full max-w-xs" />
                        ) : (
                            <h1 className="text-2xl font-bold text-brand-text">{user.displayName || 'Família'}</h1>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard icon={ChefHat} value={mealLog.length} label="Refeições" />
                        <StatCard icon={BookOpen} value={pantry.length} label="Itens na Despensa" />
                        <StatCard icon={Heart} value={savedRecipes.length} label="Receitas Salvas" />
                        <StatCard icon={CameraIcon} value={userPostsCount} label="Posts no Feed" />
                    </div>
                    
                    <ProductHistory />
                    
                    {/* Children Section */}
                    <div className="bg-brand-surface p-4 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-bold text-brand-text mb-3">Crianças</h3>
                        <div className="space-y-4">
                            {(isEditing ? editedProfile.children : userProfile.children)?.map(child => (
                                <ChildEditCard 
                                    key={child.id} 
                                    child={child} 
                                    isEditing={isEditing} 
                                    onUpdate={handleUpdateChild} 
                                    onRemove={handleRemoveChild} 
                                />
                            ))}
                             {isEditing && (editedProfile.children || []).length < 5 && (
                                <button onClick={handleAddChild} className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-3 rounded-lg border-2 border-dashed border-brand-border text-brand-primary hover:bg-green-50 transition-colors">
                                <Plus size={16}/> Adicionar Criança
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-center pt-4">
                        <button onClick={logout} className="flex items-center mx-auto gap-2 text-sm font-semibold text-red-500 bg-red-50 py-2 px-5 rounded-full hover:bg-red-100 transition-colors">
                            <LogOut size={14}/> Sair da Conta
                        </button>
                    </div>
                </main>

                {isEditing && (
                    <footer className="sticky bottom-0 p-3 border-t border-brand-border bg-brand-surface/80 backdrop-blur-sm flex-shrink-0">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || showSuccess}
                            className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg transition-all duration-300 hover:bg-brand-dark disabled:bg-gray-400"
                        >
                        {isSaving && <LoaderCircle className="mr-2 animate-spin" size={20} />}
                        {showSuccess && <Check className="mr-2" size={20} />}
                        <span>{isSaving ? 'Salvando...' : (showSuccess ? 'Salvo!' : 'Salvar Alterações')}</span>
                        </button>
                    </footer>
                )}
            </div>
        </>
    );
};

export default ProfileScreen;
