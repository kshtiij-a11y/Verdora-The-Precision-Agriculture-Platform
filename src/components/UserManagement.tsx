
"use client";

import React, { useState, useEffect, useRef, ChangeEvent, useTransition } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, UserCheck, FilePenLine, Loader2, Upload, X, ShieldCheck, ShieldAlert, BadgeCheck, FileText, User, Phone, MapPin, Leaf, Globe, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { verifyId, VerifyIdOutput } from "@/ai/flows/verify-id";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Progress } from "./ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";
import { ensureAuth } from "@/lib/firebaseAuth";
import { suggestCrops } from "@/ai/flows/suggest-crops";

// This type is for the app's context (the active farmer)
export type FarmerData = {
  name: string;
  phone: string;
  village: string;
  district: string;
  crop: string;
  secondaryCrop: string;
  language: string;
  idProof?: string;
};

// This type is for the Firestore document
type FarmerRegistrationDoc = {
    name: string;
    phone: string;
    village: string;
    district: string;
    crop: string;
    secondaryCrop: string;
    language: string;
    createdAt: Timestamp;
};

const initialFormData: FarmerData = {
    name: '',
    phone: '',
    village: '',
    district: '',
    crop: '',
    secondaryCrop: '',
    language: 'English', // Default language
    idProof: '',
};

type VerificationStatus = 'unverified' | 'pending' | 'success' | 'failed';
type FilePreview = { url: string; type: 'image' } | { name: string; type: 'pdf' };

export function UserManagement({ isAdmin = false }: { isAdmin?: boolean }) {
  const { registeredFarmer, setRegisteredFarmer, isLoaded } = useAppContext();
  const [formData, setFormData] = useState<FarmerData>(initialFormData);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isVerifyPending, startVerifyTransition] = useTransition();
  const [isRegisterPending, startRegisterTransition] = useTransition();
  const [isSuggestPending, startSuggestTransition] = useTransition();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');
  const [verificationResult, setVerificationResult] = useState<VerifyIdOutput | null>(null);
  const [suggestedCrops, setSuggestedCrops] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const T = (key: string, defaultText: string) => isAdmin ? defaultText : t(key);


  useEffect(() => {
      if (isLoaded) {
          if (registeredFarmer) {
              setFormData(registeredFarmer);
              if (registeredFarmer.idProof) {
                  if (registeredFarmer.idProof.startsWith('data:image')) {
                      setFilePreview({ url: registeredFarmer.idProof, type: 'image' });
                  } else if (registeredFarmer.idProof.startsWith('data:application/pdf')) {
                      setFilePreview({ name: 'id_proof.pdf', type: 'pdf' });
                  }
                  setVerificationStatus('success');
              }
          } else {
              setFormData(initialFormData);
              setFilePreview(null);
              setVerificationStatus('unverified');
              setSuggestedCrops([]);
          }
      }
  }, [registeredFarmer, isLoaded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FarmerData) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 4MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setFormData(prev => ({ ...prev, idProof: dataUri }));
        if (file.type.startsWith('image/')) {
            setFilePreview({ url: dataUri, type: 'image' });
        } else if (file.type === 'application/pdf') {
            setFilePreview({ name: file.name, type: 'pdf' });
        }
        setVerificationStatus('unverified');
        setVerificationResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, idProof: undefined }));
    setFilePreview(null);
    setVerificationStatus('unverified');
    setVerificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleVerify = () => {
    if (!formData.idProof) {
        toast({ variant: "destructive", title: "No ID", description: "Please upload an ID to verify." });
        return;
    }
    setVerificationResult(null);
    setVerificationStatus('pending');
    startVerifyTransition(async () => {
        try {
            // Do not leave the registration form spinning forever if the AI provider stalls.
            const result = await Promise.race([
                verifyId({ photoDataUri: formData.idProof! }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("ID verification timed out after 25 seconds.")), 25000)
                ),
            ]);
            setVerificationResult(result);
            if (result.isIdCard) {
                setVerificationStatus('success');
                if (result.extractedName) {
                    setFormData(prev => ({...prev, name: result.extractedName!}));
                }
                toast({ title: "Verification Successful", description: result.reason });
            } else {
                setVerificationStatus('failed');
                toast({ variant: "destructive", title: "Verification Failed", description: result.reason });
            }
        } catch (error) {
            console.error("Verification failed:", error);
            setVerificationStatus('failed');
            const message = error instanceof Error && error.message.includes("timed out")
                ? "Verification is taking too long because the AI service may be unavailable. Please try again shortly."
                : "Could not verify the ID. Please try again.";
            setVerificationResult({ isIdCard: false, reason: message });
            toast({ variant: "destructive", title: "Verification Error", description: message });
        }
    });
  };

  async function registerFarmerInFirestore(data: FarmerData) {
    await ensureAuth(); // Ensure user is authenticated

    if (!db) {
      console.error("Firestore is not initialized. Check your Firebase config.");
      throw new Error("Firestore is not connected.");
    }
    const docData: FarmerRegistrationDoc = {
      name: data.name,
      phone: data.phone,
      village: data.village,
      district: data.district,
      crop: data.crop,
      secondaryCrop: data.secondaryCrop,
      language: data.language,
      createdAt: Timestamp.now(),
    };
    const collectionRef = collection(db, "farmerregs");

    try {
      const docRef = await addDoc(collectionRef, docData);
      console.log("✅ Farmer registered successfully in Firestore with ID: ", docRef.id);
    } catch (serverError: any) {
      if (serverError?.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: docData,
        });
        // Emit the error so the central listener can catch it.
        errorEmitter.emit('permission-error', permissionError);
      }
      throw serverError;
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (verificationStatus !== 'success') {
      toast({
        variant: "destructive",
        title: "ID Not Verified",
        description: "Please verify the government ID proof before registering.",
      });
      return;
    }

    startRegisterTransition(async () => {
        try {
            await registerFarmerInFirestore(formData);
            setRegisteredFarmer(formData);
            toast({
                title: "Farmer Registered!",
                description: `${formData.name} is now ready to receive alerts.`,
            });
        } catch (error: any) {
            // This will now only catch non-Firestore errors, as permission errors are handled in registerFarmerInFirestore
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: "Could not save farmer data. Please check console for errors.",
            });
        }
    });
  };

  const handleSuggestCrops = () => {
    if (!formData.district) {
      toast({
        variant: "destructive",
        title: "Location Needed",
        description: "Please enter a District to get crop suggestions.",
      });
      return;
    }
    setSuggestedCrops([]);
    startSuggestTransition(async () => {
      try {
        const result = await suggestCrops({ location: formData.district });
        setSuggestedCrops(result.suggestedCrops);
      } catch (error) {
        console.error("Crop suggestion failed:", error);
        toast({
          variant: "destructive",
          title: "Suggestion Error",
          description: "Could not get crop suggestions. Please try again.",
        });
      }
    });
  };

  const handleReset = () => {
    setRegisteredFarmer(null);
  };

  const isFormValid =
    formData.name &&
    formData.phone &&
    formData.village &&
    formData.district &&
    formData.crop &&
    verificationStatus === 'success';


  if (!isLoaded) {
      return (
          <Card className="h-full flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </Card>
      )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
                {registeredFarmer ? <UserCheck className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
            </div>
            <div>
                <CardTitle>{registeredFarmer ? T('userManagement.currentFarmer', 'Current Farmer') : T('userManagement.registration', 'Farmer Registration')}</CardTitle>
                <CardDescription>
                {registeredFarmer ? T('userManagement.ready', 'Ready to receive SMS alerts.') : T('userManagement.registerPrompt', 'Register farmer to send alerts.')}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {registeredFarmer ? (
          <div className="flex flex-col justify-center h-full space-y-4 bg-muted/50 p-6 rounded-lg">
             <div className="space-y-2">
                <h3 className="text-lg font-semibold">{registeredFarmer.name}</h3>
                <p className="text-sm text-muted-foreground">{registeredFarmer.village}, {registeredFarmer.district} | {registeredFarmer.phone}</p>
             </div>
              {registeredFarmer.idProof && filePreview?.type === 'image' && (
                <div>
                  <p className="text-sm font-medium mb-2">{T('userManagement.idProof', 'Government ID:')}</p>
                  <div className="relative w-fit">
                    <Image src={(filePreview as {url: string}).url} alt="ID Proof" width={200} height={120} className="rounded-md object-cover border" />
                    <BadgeCheck className="absolute -top-2 -right-2 h-7 w-7 text-white bg-green-600 rounded-full p-1" />
                  </div>
                </div>
              )}
             <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{T('userManagement.primaryCrop', 'Primary Crop:')} {registeredFarmer.crop}</Badge>
                {registeredFarmer.secondaryCrop && <Badge variant="secondary">{T('userManagement.secondaryCrop', 'Secondary:')} {registeredFarmer.secondaryCrop}</Badge>}
                <Badge variant="secondary">{T('userManagement.language', 'Language:')} {registeredFarmer.language}</Badge>
             </div>
             <Button onClick={handleReset} className="w-full mt-4 !-mb-2" variant="outline">
                <FilePenLine /> {T('userManagement.registerAnother', 'Register Another Farmer')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">{T('userManagement.farmerName', 'Farmer Name')}</label>
                <div className="relative flex items-center">
                    <User className="absolute left-3 w-5 h-5 text-muted-foreground" />
                    <Input id="name" name="name" placeholder={T('userManagement.farmerNamePlaceholder', 'e.g., John Doe')} value={formData.name} onChange={handleChange} required className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">{T('userManagement.phone', 'Phone Number')}</label>
                <div className="relative flex items-center">
                    <Phone className="absolute left-3 w-5 h-5 text-muted-foreground" />
                    <Input id="phone" name="phone" type="tel" placeholder={T('userManagement.phonePlaceholder', 'e.g., +1234567890')} value={formData.phone} onChange={handleChange} required className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="village" className="text-sm font-medium">{T('userManagement.location', 'Location / Village')}</label>
                <div className="relative flex items-center">
                    <MapPin className="absolute left-3 w-5 h-5 text-muted-foreground" />
                    <Input id="village" name="village" placeholder={T('userManagement.locationPlaceholder', 'e.g., Springfield')} value={formData.village} onChange={handleChange} required className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="district" className="text-sm font-medium">District</label>
                <div className="relative flex items-center">
                    <Globe className="absolute left-3 w-5 h-5 text-muted-foreground" />
                    <Input id="district" name="district" placeholder="e.g., Sitapur" value={formData.district} onChange={handleChange} required className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="language-select" className="text-sm font-medium">{T('userManagement.preferredLanguage', 'Preferred Language')}</label>
                <Select name="language" value={formData.language} onValueChange={handleSelectChange('language')}>
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder={T('userManagement.selectLanguage', 'Select language')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Bengali">Bengali</SelectItem>
                    <SelectItem value="Telugu">Telugu</SelectItem>
                    <SelectItem value="Marathi">Marathi</SelectItem>
                    <SelectItem value="Tamil">Tamil</SelectItem>
                    <SelectItem value="Urdu">Urdu</SelectItem>
                    <SelectItem value="Gujarati">Gujarati</SelectItem>
                    <SelectItem value="Kannada">Kannada</SelectItem>
                    <SelectItem value="Punjabi">Punjabi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="crop-select" className="text-sm font-medium">{T('userManagement.primaryCropLabel', 'Primary Crop')}</label>
                    <Button type="button" variant="link" size="sm" onClick={handleSuggestCrops} disabled={isSuggestPending || !formData.district} className="h-auto p-0">
                        {isSuggestPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lightbulb className="w-4 h-4" />}
                        Suggest Crops
                    </Button>
                </div>
                <Select name="crop" value={formData.crop} onValueChange={handleSelectChange('crop')} required>
                  <SelectTrigger id="crop-select">
                    <SelectValue placeholder={T('userManagement.selectCrop', 'Select crop')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apples">Apples</SelectItem>
                    <SelectItem value="Bananas">Bananas</SelectItem>
                    <SelectItem value="Barley">Barley</SelectItem>
                    <SelectItem value="Chickpeas">Chickpeas</SelectItem>
                    <SelectItem value="Coffee">Coffee</SelectItem>
                    <SelectItem value="Corn">Corn</SelectItem>
                    <SelectItem value="Cotton">Cotton</SelectItem>
                    <SelectItem value="Grapes">Grapes</SelectItem>
                    <SelectItem value="Jute">Jute</SelectItem>
                    <SelectItem value="Lentils">Lentils</SelectItem>
                    <SelectItem value="Mangoes">Mangoes</SelectItem>
                    <SelectItem value="Millet">Millet</SelectItem>
                    <SelectItem value="Onions">Onions</SelectItem>
                    <SelectItem value="Potatoes">Potatoes</SelectItem>
                    <SelectItem value="Rice">Rice</SelectItem>
                    <SelectItem value="Soybeans">Soybeans</SelectItem>
                    <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                    <SelectItem value="Tea">Tea</SelectItem>
                    <SelectItem value="Tomatoes">Tomatoes</SelectItem>
                    <SelectItem value="Wheat">Wheat</SelectItem>
                  </SelectContent>
                </Select>
                 {suggestedCrops.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {suggestedCrops.map(crop => (
                            <Badge 
                                key={crop} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleSelectChange('crop')(crop)}
                            >
                                {crop}
                            </Badge>
                        ))}
                    </div>
                 )}
              </div>
               <div className="space-y-2">
                <label htmlFor="secondary-crop-select" className="text-sm font-medium">{T('userManagement.secondaryCropLabel', 'Secondary Crop (Optional)')}</label>
                <Select name="secondaryCrop" value={formData.secondaryCrop} onValueChange={handleSelectChange('secondaryCrop')}>
                  <SelectTrigger id="secondary-crop-select">
                    <SelectValue placeholder={T('userManagement.selectSecondaryCrop', 'Select secondary crop')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apples">Apples</SelectItem>
                    <SelectItem value="Bananas">Bananas</SelectItem>
                    <SelectItem value="Barley">Barley</SelectItem>
                    <SelectItem value="Chickpeas">Chickpeas</SelectItem>
                    <SelectItem value="Coffee">Coffee</SelectItem>
                    <SelectItem value="Corn">Corn</SelectItem>
                    <SelectItem value="Cotton">Cotton</SelectItem>
                    <SelectItem value="Grapes">Grapes</SelectItem>
                    <SelectItem value="Jute">Jute</SelectItem>
                    <SelectItem value="Lentils">Lentils</SelectItem>
                    <SelectItem value="Mangoes">Mangoes</SelectItem>
                    <SelectItem value="Millet">Millet</SelectItem>
                    <SelectItem value="Onions">Onions</SelectItem>
                    <SelectItem value="Potatoes">Potatoes</SelectItem>
                    <SelectItem value="Rice">Rice</SelectItem>
                    <SelectItem value="Soybeans">Soybeans</SelectItem>
                    <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                    <SelectItem value="Tea">Tea</SelectItem>
                    <SelectItem value="Tomatoes">Tomatoes</SelectItem>
                    <SelectItem value="Wheat">Wheat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t">
              <label htmlFor="id-proof-upload" className="text-sm font-medium">{T('userManagement.govIdProof', 'Government ID Proof')}</label>
              <div
                className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:bg-accent/20 hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                  <input
                    type="file"
                    id="id-proof-upload"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp, application/pdf"
                  />
                  {filePreview ? (
                     <div className="relative group w-fit mx-auto">
                        {filePreview.type === 'image' ? (
                            <Image
                                src={filePreview.url}
                                alt="ID preview"
                                width={200}
                                height={120}
                                className="rounded-md mx-auto max-h-32 w-auto object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                                <FileText className="w-12 h-12" />
                                <p className="text-sm font-semibold">{filePreview.name}</p>
                            </div>
                        )}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="w-8 h-8" />
                        <p className="font-semibold">{T('userManagement.uploadId', 'Click to upload ID')}</p>
                        <p className="text-xs">{T('userManagement.idTypes', 'Aadhar, PAN, Ration Card, or Gas Connection')}</p>
                        <p className="text-xs">{T('userManagement.fileTypes', 'PNG, JPG, PDF (max 4MB)')}</p>
                    </div>
                  )}
              </div>
              
              {filePreview && (
                  <div className="space-y-2">
                    <Button type="button" onClick={handleVerify} disabled={isVerifyPending || verificationStatus === 'success'} className="w-full">
                        {isVerifyPending && <><Loader2 className="animate-spin" /> {T('userManagement.verifying', 'Verifying...')}</>}
                        {verificationStatus === 'unverified' && <><ShieldCheck /> {T('userManagement.verifyId', 'Verify ID')}</>}
                        {verificationStatus === 'pending' && <><Loader2 className="animate-spin" /> {T('userManagement.verifying', 'Verifying...')}</>}
                        {verificationStatus === 'success' && <><BadgeCheck /> {T('userManagement.idVerified', 'ID Verified')}</>}
                        {verificationStatus === 'failed' && <><ShieldAlert /> {T('userManagement.verificationFailed', 'Verification Failed')}</>}
                    </Button>
                    {verificationResult && (
                      <div className="space-y-2">
                        {verificationStatus === 'failed' && (
                          <Alert variant="destructive">
                              <ShieldAlert className="h-4 w-4" />
                              <AlertTitle>Verification Failed</AlertTitle>
                              <AlertDescription>{verificationResult.reason}</AlertDescription>
                          </Alert>
                        )}
                        {verificationStatus === 'success' && verificationResult.confidenceScore && (
                           <div className="space-y-1">
                               <div className="flex justify-between text-xs text-muted-foreground">
                                   <span>Confidence</span>
                                   <span>{(verificationResult.confidenceScore * 100).toFixed(0)}%</span>
                               </div>
                               <Progress value={verificationResult.confidenceScore * 100} className="h-2" />
                           </div>
                        )}
                      </div>
                    )}
                  </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={!isFormValid || isRegisterPending}>
              {isRegisterPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
              {T('userManagement.registerFarmer', 'Register Farmer')}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
