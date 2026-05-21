export const dateFormat = (date) => {
  return new Date(date).toLocaleString('en-US',{
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })
}
