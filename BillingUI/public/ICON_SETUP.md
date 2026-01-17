# Mobile App Icon Setup Guide

## Steps to Add Your Billing Software Icon

### 1. Save Your Image
1. Save your billing software icon image to the `BillingUI/public/` folder
2. Name it `icon-original.png` (or keep your original filename)

### 2. Create Icon Sizes
You need to create multiple icon sizes for different devices:

#### Required Sizes:
- **192x192** - For Android home screen
- **512x512** - For Android splash screen and high-res displays
- **180x180** - For iOS home screen (Apple touch icon)
- **32x32** - For favicon (browser tab)

#### Tools to Resize:
- **Online**: Use https://www.iloveimg.com/resize-image or https://imageresizer.com
- **Photoshop/GIMP**: Open image → Image → Image Size → Set dimensions
- **Command Line** (ImageMagick): 
  ```bash
  convert icon-original.png -resize 192x192 icon-192.png
  convert icon-original.png -resize 512x512 icon-512.png
  convert icon-original.png -resize 180x180 apple-touch-icon.png
  convert icon-original.png -resize 32x32 favicon-32x32.png
  ```

### 3. File Structure
After creating the icons, your `BillingUI/public/` folder should have:
```
public/
  ├── icon-192.png
  ├── icon-512.png
  ├── apple-touch-icon.png
  ├── favicon-32x32.png
  ├── favicon.ico (optional, for older browsers)
  └── manifest.json
```

### 4. Icon Design Tips
- Use a square image (1:1 aspect ratio)
- Keep important content in the center (safe area)
- Use transparent background or solid color
- Ensure icons are clear at small sizes
- Test on actual devices after setup

### 5. Testing
After adding icons:
1. Clear browser cache
2. Test PWA installation on mobile device
3. Check favicon appears in browser tab
4. Verify home screen icon on Android/iOS

