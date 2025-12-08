import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import {
  TemplateCustomization,
  ColorScheme,
  FontFamily,
  TemplateLayout,
  COLOR_SCHEMES,
  FONT_FAMILIES,
} from '@/types/template';
import { Palette, Type, Layout, Settings, MoveVertical } from 'lucide-react';

interface TemplateCustomizerProps {
  customization: TemplateCustomization;
  onChange: (customization: TemplateCustomization) => void;
  onReset?: () => void;
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  customization,
  onChange,
  onReset,
}) => {
  const handleColorSchemeChange = (colorScheme: ColorScheme) => {
    onChange({ ...customization, colorScheme });
  };

  const handleFontFamilyChange = (fontFamily: FontFamily) => {
    onChange({ ...customization, fontFamily });
  };

  const handleLayoutChange = (layout: TemplateLayout) => {
    onChange({ ...customization, layout });
  };

  const handleToggle = (key: keyof TemplateCustomization) => {
    onChange({ ...customization, [key]: !customization[key] });
  };

  const handleNumberChange = (key: keyof TemplateCustomization, value: number) => {
    onChange({ ...customization, [key]: value });
  };

  const handleHeaderStyleChange = (headerStyle: 'centered' | 'left' | 'two-column') => {
    onChange({ ...customization, headerStyle });
  };

  return (
    <div className="space-y-6">
      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Scheme
          </CardTitle>
          <CardDescription>Choose a color palette for your resume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(COLOR_SCHEMES) as ColorScheme[]).map((scheme) => {
              const colors = COLOR_SCHEMES[scheme];
              const isSelected = customization.colorScheme === scheme;

              return (
                <button
                  key={scheme}
                  onClick={() => handleColorSchemeChange(scheme)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary-600 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: colors.secondary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: colors.accent }}
                    />
                  </div>
                  <p className="text-sm font-medium text-left">
                    {scheme
                      .split('-')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Font Family */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Font Family
          </CardTitle>
          <CardDescription>Select a font for your resume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(Object.keys(FONT_FAMILIES) as FontFamily[]).map((font) => {
              const fontInfo = FONT_FAMILIES[font];
              const isSelected = customization.fontFamily === font;

              return (
                <button
                  key={font}
                  onClick={() => handleFontFamilyChange(font)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${fontInfo.cssClass}`}>{fontInfo.name}</p>
                      <p className="text-xs text-gray-500">{fontInfo.category}</p>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Layout
          </CardTitle>
          <CardDescription>Choose your resume layout style</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <button
              onClick={() => handleLayoutChange('single-column')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                customization.layout === 'single-column'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-gray-300 rounded flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-300 rounded" />
                </div>
                <div>
                  <p className="font-medium">Single Column</p>
                  <p className="text-xs text-gray-500">Traditional layout</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleLayoutChange('two-column-left')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                customization.layout === 'two-column-left'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-gray-300 rounded flex gap-1 p-1">
                  <div className="w-4 h-full bg-gray-400 rounded" />
                  <div className="flex-1 bg-gray-300 rounded" />
                </div>
                <div>
                  <p className="font-medium">Two Column (Left Sidebar)</p>
                  <p className="text-xs text-gray-500">Sidebar on left</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleLayoutChange('two-column-right')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                customization.layout === 'two-column-right'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-gray-300 rounded flex gap-1 p-1">
                  <div className="flex-1 bg-gray-300 rounded" />
                  <div className="w-4 h-full bg-gray-400 rounded" />
                </div>
                <div>
                  <p className="font-medium">Two Column (Right Sidebar)</p>
                  <p className="text-xs text-gray-500">Sidebar on right</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Display Options
          </CardTitle>
          <CardDescription>Customize visual elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Photo</p>
              <p className="text-xs text-gray-500">Display profile photo</p>
            </div>
            <Switch
              checked={customization.showPhoto}
              onCheckedChange={() => handleToggle('showPhoto')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Icons</p>
              <p className="text-xs text-gray-500">Display section icons</p>
            </div>
            <Switch
              checked={customization.showIcons}
              onCheckedChange={() => handleToggle('showIcons')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Progress Bars</p>
              <p className="text-xs text-gray-500">Display skill levels</p>
            </div>
            <Switch
              checked={customization.showProgressBars}
              onCheckedChange={() => handleToggle('showProgressBars')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Header Style */}
      <Card>
        <CardHeader>
          <CardTitle>Header Style</CardTitle>
          <CardDescription>Choose how to display your header</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(['centered', 'left', 'two-column'] as const).map((style) => (
              <button
                key={style}
                onClick={() => handleHeaderStyleChange(style)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  customization.headerStyle === style
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium capitalize">{style.replace('-', ' ')}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Adjust text sizing and spacing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Font Size</span>
              <span className="text-sm text-gray-500">{customization.fontSize}px</span>
            </label>
            <input
              type="range"
              min="12"
              max="16"
              step="0.5"
              value={customization.fontSize}
              onChange={(e) => handleNumberChange('fontSize', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Line Height</span>
              <span className="text-sm text-gray-500">{customization.lineHeight}</span>
            </label>
            <input
              type="range"
              min="1.3"
              max="1.8"
              step="0.1"
              value={customization.lineHeight}
              onChange={(e) => handleNumberChange('lineHeight', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Section Spacing</span>
              <span className="text-sm text-gray-500">{customization.sectionSpacing}px</span>
            </label>
            <input
              type="range"
              min="8"
              max="24"
              step="2"
              value={customization.sectionSpacing}
              onChange={(e) => handleNumberChange('sectionSpacing', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      {onReset && (
        <Button variant="outline" className="w-full" onClick={onReset}>
          Reset to Default
        </Button>
      )}
    </div>
  );
};

export default TemplateCustomizer;
