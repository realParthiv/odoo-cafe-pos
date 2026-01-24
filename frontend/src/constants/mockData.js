// Mock data for cashier UI development

export const CATEGORIES = [
  { id: 1, name: 'Food', color: '#4A90E2', sequence: 1 },
  { id: 2, name: 'Drink', color: '#F5D76E', sequence: 2 },
  { id: 3, name: 'Pastries', color: '#E57373', sequence: 3 },
  { id: 4, name: 'Quick Bites', color: '#81C784', sequence: 4 },
];

export const PRODUCTS = [
  {
    id: 1,
    name: 'Burger',
    description: 'Delicious beef burger with cheese',
    price: 25,
    category_id: 1,
    category_name: 'Food',
    category_color: '#4A90E2',
    tax_rate: 5,
    uom: 'Unit',
    image_url: 'C:/Users/Lenovo/.gemini/antigravity/brain/86f27111-cb5a-4e0c-ad67-3183da8481bb/burger_product_1769250248001.png',
    has_variants: false,
  },
  {
    id: 2,
    name: 'Coffee',
    description: 'Fresh brewed coffee',
    price: 25,
    category_id: 2,
    category_name: 'Drink',
    category_color: '#F5D76E',
    tax_rate: 5,
    uom: '6 Pack',
    image_url: 'C:/Users/Lenovo/.gemini/antigravity/brain/86f27111-cb5a-4e0c-ad67-3183da8481bb/coffee_product_1769250265370.png',
    has_variants: true,
  },
  {
    id: 3,
    name: 'Croissant',
    description: 'Buttery croissant',
    price: 15,
    category_id: 3,
    category_name: 'Pastries',
    category_color: '#E57373',
    tax_rate: 18,
    uom: 'Unit',
    image_url: 'C:/Users/Lenovo/.gemini/antigravity/brain/86f27111-cb5a-4e0c-ad67-3183da8481bb/croissant_product_1769250283485.png',
    has_variants: false,
  },
  {
    id: 4,
    name: 'Pizza Slice',
    description: 'Cheese pizza slice',
    price: 20,
    category_id: 1,
    category_name: 'Food',
    category_color: '#4A90E2',
    tax_rate: 5,
    uom: 'Unit',
    image_url: 'C:/Users/Lenovo/.gemini/antigravity/brain/86f27111-cb5a-4e0c-ad67-3183da8481bb/pizza_product_1769250301133.png',
    has_variants: false,
  },
  {
    id: 5,
    name: 'Orange Juice',
    description: 'Fresh orange juice',
    price: 18,
    category_id: 2,
    category_name: 'Drink',
    category_color: '#F5D76E',
    tax_rate: 5,
    uom: 'K.G',
    image_url: 'C:/Users/Lenovo/.gemini/antigravity/brain/86f27111-cb5a-4e0c-ad67-3183da8481bb/orange_juice_product_1769250334386.png',
    has_variants: true,
  },
  {
    id: 6,
    name: 'Sandwich',
    description: 'Club sandwich',
    price: 22,
    category_id: 4,
    category_name: 'Quick Bites',
    category_color: '#81C784',
    tax_rate: 5,
    uom: 'Unit',
    image_url: 'C:/Users/Lenovo/.gemini/antigravity/brain/86f27111-cb5a-4e0c-ad67-3183da8481bb/sandwich_product_1769250349763.png',
    has_variants: false,
  },
  {
    id: 7,
    name: 'Cake',
    description: 'Chocolate cake slice',
    price: 30,
    category_id: 3,
    category_name: 'Pastries',
    category_color: '#E57373',
    tax_rate: 28,
    uom: 'Unit',
    image_url: '/images/cake.jpg',
    has_variants: false,
  },
  {
    id: 8,
    name: 'Tea',
    description: 'Hot tea',
    price: 12,
    category_id: 2,
    category_name: 'Drink',
    category_color: '#F5D76E',
    tax_rate: 5,
    uom: 'Unit',
    image_url: '/images/tea.jpg',
    has_variants: false,
  },
];

export const PRODUCT_VARIANTS = {
  2: [ // Coffee variants
    { id: 1, attribute: 'Pack', value: '6', unit: 'Unit', extra_price: 0 },
    { id: 2, attribute: 'Pack', value: '12', unit: 'Unit', extra_price: 20 },
    { id: 3, attribute: 'Size', value: 'Small', unit: 'Liter', extra_price: 0 },
    { id: 4, attribute: 'Size', value: 'Large', unit: 'Liter', extra_price: 10 },
  ],
  5: [ // Orange Juice variants
    { id: 5, attribute: 'Size', value: '500ml', unit: 'K.G', extra_price: 0 },
    { id: 6, attribute: 'Size', value: '1L', unit: 'K.G', extra_price: 15 },
  ],
};

export const FLOOR_PLANS = [
  {
    id: 1,
    name: 'Ground Floor',
    restaurant_id: 1,
    tables: [
      { id: 101, table_number: '101', seats: 4, status: 'available', active: true, current_order_id: null },
      { id: 102, table_number: '102', seats: 2, status: 'occupied', active: true, current_order_id: 1 },
      { id: 103, table_number: '103', seats: 6, status: 'available', active: true, current_order_id: null },
      { id: 104, table_number: '104', seats: 4, status: 'reserved', active: true, current_order_id: null },
      { id: 105, table_number: '105', seats: 2, status: 'available', active: true, current_order_id: null },
    ],
  },
  {
    id: 2,
    name: 'First Floor',
    restaurant_id: 1,
    tables: [
      { id: 201, table_number: '201', seats: 8, status: 'available', active: true, current_order_id: null },
      { id: 202, table_number: '202', seats: 4, status: 'available', active: true, current_order_id: null },
      { id: 203, table_number: '203', seats: 4, status: 'occupied', active: true, current_order_id: 2 },
    ],
  },
];

export const PAYMENT_METHODS = [
  { id: 1, name: 'Cash', type: 'cash' },
  { id: 2, name: 'Credit Card', type: 'card' },
  { id: 3, name: 'Debit Card', type: 'card' },
  { id: 4, name: 'UPI', type: 'digital' },
  { id: 5, name: 'Wallet', type: 'digital' },
];

export const MOCK_SESSION = {
  id: 1,
  cashier_id: 1,
  cashier_name: 'John Doe',
  start_time: new Date().toISOString(),
  starting_cash: 1000,
  status: 'open',
};

export const TAX_RATES = [
  { value: 5, label: '5%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' },
];

export const TABLE_STATUSES = [
  { value: 'available', label: 'Available', color: '#81C784' },
  { value: 'occupied', label: 'Occupied', color: '#E57373' },
  { value: 'reserved', label: 'Reserved', color: '#FFB74D' },
];

export const ORDER_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent_to_kitchen', label: 'Sent to Kitchen' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
