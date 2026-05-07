# Theme

As of `v3.1.0`, MissingCore Music supports custom themes. These themes can be imported & exported so that you can share it with others.

Themes are imported & exported as `.json` files. As an example:

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

> [!IMPORTANT]
> We only support 3/6-digit Hex color codes (ie: no opacity).
