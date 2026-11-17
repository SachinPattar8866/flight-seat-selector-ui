const inr = new Intl.NumberFormat('en-IN')
export const formatPrice = (amount) => (amount === 0 ? 'Free' : `₹${inr.format(amount)}`)
export const formatAmount = (amount) => `₹${inr.format(amount)}`
