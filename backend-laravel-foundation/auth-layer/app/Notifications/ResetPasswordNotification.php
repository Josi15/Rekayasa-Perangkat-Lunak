<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Email reset password. Dikirim lewat ANTREAN supaya waktu respons endpoint "lupa password"
 * sama untuk akun yang ada maupun tidak (mencegah enumerasi akun lewat selisih waktu).
 * Pastikan worker berjalan (php artisan queue:work) atau QUEUE_CONNECTION=sync di lokal.
 */
class ResetPasswordNotification extends ResetPassword implements ShouldQueue
{
    use Queueable;

    /**
     * @param  string  $url
     */
    protected function buildMailMessage($url): MailMessage
    {
        $menit = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

        return (new MailMessage)
            ->subject('Atur Ulang Password LMS Simba')
            ->line('Kami menerima permintaan untuk mengatur ulang password akun LMS Simba Anda.')
            ->action('Atur Ulang Password', $url)
            ->line("Tautan ini berlaku selama {$menit} menit dan hanya dapat dipakai sekali.")
            ->line('Jika Anda tidak meminta ini, abaikan email ini; password Anda tidak berubah.');
    }
}
