# Mobile Responsive Design Guide

This guide outlines the patterns and best practices for making all pages mobile-friendly.

## Common Patterns

### 1. Page Headers
**Before:**
```tsx
<div className="flex justify-between items-center">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
    <p className="mt-1 text-sm text-gray-500">Description</p>
  </div>
  <button>Action</button>
</div>
```

**After:**
```tsx
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
  <div>
    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Page Title</h1>
    <p className="mt-1 text-xs sm:text-sm text-gray-500">Description</p>
  </div>
  <button className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm">
    Action
  </button>
</div>
```

### 2. Tables
**Before:**
```tsx
<div className="bg-white shadow rounded-lg overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
```

**After:**
```tsx
<div className="bg-white shadow rounded-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      {/* Table content */}
    </table>
  </div>
</div>
```

**Table Headers - Hide less important columns on mobile:**
```tsx
<th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
  Less Important Column
</th>
```

**Table Cells - Show key info on mobile:**
```tsx
<td className="px-3 sm:px-6 py-4">
  <div className="text-sm font-medium text-gray-900">Main Info</div>
  <div className="sm:hidden text-xs text-gray-500 mt-1">Additional Info</div>
</td>
```

### 3. Button Groups
**Before:**
```tsx
<div className="flex space-x-2">
  <button>Button 1</button>
  <button>Button 2</button>
  <button>Button 3</button>
</div>
```

**After:**
```tsx
<div className="flex flex-wrap gap-2">
  <button className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm">
    <Icon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
    <span className="hidden sm:inline">Full Text</span>
    <span className="sm:hidden">Short</span>
  </button>
</div>
```

### 4. Forms and Inputs
**Before:**
```tsx
<div className="bg-white shadow rounded-lg p-4">
  <input className="w-full pl-10 pr-4 py-2" />
</div>
```

**After:**
```tsx
<div className="bg-white shadow rounded-lg p-3 sm:p-4">
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
    <input className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm" />
  </div>
</div>
```

### 5. Grid Layouts
**Before:**
```tsx
<div className="grid grid-cols-3 gap-4">
```

**After:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 6. Modals
**Before:**
```tsx
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
  <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
```

**After:**
```tsx
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
  <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white">
```

### 7. Spacing
**Before:**
```tsx
<div className="space-y-6">
```

**After:**
```tsx
<div className="space-y-4 sm:space-y-6">
```

## Responsive Breakpoints

- `sm:` - 640px and up (small tablets)
- `md:` - 768px and up (tablets)
- `lg:` - 1024px and up (desktops)
- `xl:` - 1280px and up (large desktops)

## Key Principles

1. **Mobile First**: Design for mobile, then enhance for larger screens
2. **Progressive Disclosure**: Hide less important information on mobile
3. **Touch-Friendly**: Buttons should be at least 44x44px on mobile
4. **Readable Text**: Use appropriate font sizes (text-xs on mobile, text-sm on desktop)
5. **Horizontal Scroll**: Use `overflow-x-auto` for tables on mobile
6. **Stack Vertically**: Use `flex-col` on mobile, `flex-row` on desktop

## Pages Updated

- ✅ Products
- ✅ Customers
- ✅ Invoices
- ✅ Layout (Navigation)

## Pages To Update

- [ ] Dashboard
- [ ] CreateInvoice
- [ ] ViewInvoice
- [ ] Inventory
- [ ] NewProduct
- [ ] ProductVariantCombinations
- [ ] SizeCharts
- [ ] SalesReturns
- [ ] SalesExchanges
- [ ] All Report pages
- [ ] All other pages

## Testing Checklist

- [ ] Test on mobile device (320px - 480px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1024px+ width)
- [ ] Verify tables scroll horizontally on mobile
- [ ] Verify buttons are touch-friendly
- [ ] Verify text is readable
- [ ] Verify modals are properly sized
- [ ] Verify forms stack properly
- [ ] Verify navigation works on mobile

