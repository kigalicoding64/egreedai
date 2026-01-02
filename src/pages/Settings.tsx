import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Volume2, History, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { SUPPORTED_LANGUAGES, Language } from '@/components/chat/LanguageSelector';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { preferences, loading, savePreferences } = useUserPreferences();
  
  const [languageCode, setLanguageCode] = useState('en');
  const [languageName, setLanguageName] = useState('English');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceAutoSpeak, setVoiceAutoSpeak] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (preferences) {
      setLanguageCode(preferences.language_code);
      setLanguageName(preferences.language_name);
      setVoiceEnabled(preferences.voice_enabled);
      setVoiceAutoSpeak(preferences.voice_auto_speak);
      setVoiceSpeed(preferences.voice_speed);
      setHistoryEnabled(preferences.conversation_history_enabled);
      setRetentionDays(preferences.conversation_retention_days);
    }
  }, [preferences]);

  const handleLanguageChange = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (lang) {
      setLanguageCode(lang.code);
      setLanguageName(lang.name);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePreferences({
        language_code: languageCode,
        language_name: languageName,
        voice_enabled: voiceEnabled,
        voice_auto_speak: voiceAutoSpeak,
        voice_speed: voiceSpeed,
        conversation_history_enabled: historyEnabled,
        conversation_retention_days: retentionDays,
      });
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Language Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language Preferences
            </CardTitle>
            <CardDescription>
              Set your preferred language for the AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Language</Label>
              <Select value={languageCode} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Voice Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Voice Preferences
            </CardTitle>
            <CardDescription>
              Configure voice input and output settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Voice Features</Label>
                <p className="text-sm text-muted-foreground">
                  Allow voice input and output in chat
                </p>
              </div>
              <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Speak Responses</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically read AI responses aloud
                </p>
              </div>
              <Switch 
                checked={voiceAutoSpeak} 
                onCheckedChange={setVoiceAutoSpeak}
                disabled={!voiceEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Voice Speed</Label>
                <span className="text-sm text-muted-foreground">{voiceSpeed.toFixed(1)}x</span>
              </div>
              <Slider
                value={[voiceSpeed]}
                onValueChange={([v]) => setVoiceSpeed(v)}
                min={0.5}
                max={2}
                step={0.1}
                disabled={!voiceEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Conversation History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Conversation History
            </CardTitle>
            <CardDescription>
              Manage how your conversations are stored
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Save Conversation History</Label>
                <p className="text-sm text-muted-foreground">
                  Keep a record of your past conversations
                </p>
              </div>
              <Switch checked={historyEnabled} onCheckedChange={setHistoryEnabled} />
            </div>

            <div className="space-y-2">
              <Label>History Retention</Label>
              <Select 
                value={retentionDays.toString()} 
                onValueChange={(v) => setRetentionDays(parseInt(v))}
                disabled={!historyEnabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="-1">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </main>
    </div>
  );
};

export default Settings;
