import Swal from 'sweetalert2'

// SweetAlert2 configuration with custom styling
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

// Custom toast functions
export const toast = {
  success: (message: string) => {
    return Toast.fire({
      icon: 'success',
      title: message,
    })
  },

  error: (message: string) => {
    return Toast.fire({
      icon: 'error',
      title: message,
    })
  },

  warning: (message: string) => {
    return Toast.fire({
      icon: 'warning',
      title: message,
    })
  },

  info: (message: string) => {
    return Toast.fire({
      icon: 'info',
      title: message,
    })
  }
}

// Alternative dialog-style alerts
export const alert = {
  confirm: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'hsl(var(--primary))',
      cancelButtonColor: 'hsl(var(--muted))',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    })
  },

  delete: (title: string = 'Are you sure?', text: string = 'This action cannot be undone.') => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'hsl(var(--destructive))',
      cancelButtonColor: 'hsl(var(--muted))',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    })
  }
}

export default { toast, alert }