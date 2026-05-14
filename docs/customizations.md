# Customizations

The app offers a wide range of customizations. Some are mentioned below.

## Fonts

You can customize what font is used for primary (ie: general text) & accent (ie: headings) content. As of `v3.1.0`, you can upload fonts (`.otf` or `.ttf`) into the app. **Due to Android funkiness, we only support one weight, so make sure you upload the font with the desired weight (ie: Light/Regular/Medium, 300/400/500).**

> [!NOTE]
> There's a chance of some weird UI issues occurring due to using custom fonts (ie: missing text, clipped content).

## Custom Themes

You can customize the theme the app uses (light/dark/system). As of `v3.1.0`, you can create your own theme manually in the app or by importing a `.txt` or `.json` file with the structure below. These themes can also be exported (as a `.json` file), allowing you to share them with others.

> [!IMPORTANT]
> We only support 3/6-digit Hex color codes (ie: no opacity).

```json
{
  "name": "Sepia",
  "scheme": "light",
  "colors": {
    "primary": "#B35C00",
    "primaryDim": "#8F4A00",
    "onPrimary": "#FFFFFF",
    "onPrimaryVariant": "#FFF3E0",

    "secondary": "#1A7A00",
    "secondaryDim": "#145F00",
    "onSecondary": "#FFFFFF",
    "onSecondaryVariant": "#F0FFF0",

    "error": "#B00020",
    "errorDim": "#8C0018",
    "onError": "#FFFFFF",
    "onErrorVariant": "#FFF0F0",

    "surfaceDim": "#C4B080",
    "surface": "#F5EACC",
    "surfaceBright": "#FFF8E1",
    "surfaceContainerLowest": "#EDE0B8",
    "surfaceContainerLow": "#E5D8A8",
    "surfaceContainer": "#DBCC96",
    "surfaceContainerHigh": "#CFBF80",
    "surfaceContainerHighest": "#C4B26C",

    "onSurface": "#2E1F00",
    "onSurfaceVariant": "#5C4400",
    "outline": "#8A6B2A",
    "outlineVariant": "#C4A55A",

    "inverseSurface": "#2E1F00",
    "inverseOnSurface": "#FFF8E1"
  }
}
```

## Tab Order

You can customize the order of the home screens, hide screens, and specify which screen is displayed when you launch the app via the `Tab Order` feature found in `Settings > Appearance`.
