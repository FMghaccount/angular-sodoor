import {Component, OnInit, inject, signal, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {FSDirectoryHandle, idbClear, idbGet, idbSet} from './indexDB';


@Component({
  selector: 'app-file-download',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './file-download.component.html',
})
export class FileDownloadComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId)

  readonly directoryHandle = signal<FSDirectoryHandle | null>(null);
  readonly isDownloading = signal(false);
  fileName = `report-${Date.now()}.txt`;
  content = `Generated at ${new Date().toISOString()}\nHello from Angular 18 + PrimeNG 18!`;

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) {
      return
    }

    if (!('showDirectoryPicker' in window)) return;

    try {
      const savedHandle = await idbGet();
      if (savedHandle) {
        this.directoryHandle.set(savedHandle);
      }
    } catch (e) {
      console.warn('خطا در بازیابی پوشه از حافظه مرورگر', e);
    }
  }

  async selectDirectory(): Promise<FSDirectoryHandle | null> {
    if (!('showDirectoryPicker' in window)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'مرورگر پشتیبانی نمی‌شود',
        detail: 'لطفاً از مرورگر مبتنی بر کروم (مانند Chrome یا Edge) استفاده کنید.'
      });
      return null;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({mode: 'readwrite'});
      this.directoryHandle.set(handle);
      await idbSet(handle);
      this.messageService.add({
        severity: 'success',
        summary: 'ذخیره شد',
        detail: `پوشه ${handle.name} با موفقیت انتخاب شد.`
      });
      return handle;
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        this.messageService.add({
          severity: 'warn',
          summary: 'خطا',
          // detail: err?.message ?? 'امکان انتخاب پوشه وجود ندارد.فایل در مسیر پیشفرض مرورگر ذخیره می شود'
          detail: 'امکان انتخاب پوشه وجود ندارد.فایل در مسیر پیشفرض مرورگر ذخیره می شود'
        });
      }
      return null;
    }
  }

  async downloadFile(): Promise<void> {
    if (this.isDownloading()) return;


    // 1. مرورگرهای غیر کرومی (مثل فایرفاکس و سافاری)
    if (!('showDirectoryPicker' in window)) {
      this.isDownloading.set(true);

      this.messageService.add({
        severity: 'info',
        summary: 'دانلود معمولی',
        detail: 'مرورگر شما انتخاب پوشه را پشتیبانی نمی‌کند. فایل به صورت مستقیم دانلود می‌شود. (اگر مرورگر شما برای پرسیدن محل ذخیره تنظیم شده باشد، این کار را انجام می‌دهد).',
        life: 6000
      });

      this.fallbackDownload(this.content, this.fileName);

      this.isDownloading.set(false);
      return;
    }

    // 2. مرورگرهای مبتنی بر کروم
    let dirHandle = this.directoryHandle();

    if (!dirHandle) {
      dirHandle = await this.selectDirectory();
      if (!dirHandle) {
        this.fallbackDownload(this.content, this.fileName);
        return;
      }
    }

    const hasPermission = await this.verifyPermission(dirHandle);
    if (!hasPermission) {
      this.messageService.add({
        severity: 'warn',
        summary: 'دسترسی رد شد',
        detail: 'لطفاً پوشه را مجدداً انتخاب کنید.'
      });
      await this.clearSavedDirectory();
      return;
    }

    this.isDownloading.set(true);
    try {
      const fileHandle = await dirHandle.getFileHandle(this.fileName, {create: true});
      const writable = await fileHandle.createWritable();
      await writable.write(this.content);
      await writable.close();

      this.messageService.add({
        severity: 'success',
        summary: 'دانلود شد',
        detail: `فایل ${this.fileName} در پوشه ${dirHandle.name} ذخیره شد.`
      });
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'خطا',
        detail: err?.message ?? 'خطای ناشناخته هنگام ذخیره فایل.'
      });
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        await this.clearSavedDirectory();
      }
    } finally {
      this.isDownloading.set(false);
    }
  }

  private async verifyPermission(handle: FSDirectoryHandle): Promise<boolean> {
    const opts = {mode: 'readwrite' as 'readwrite'};

    if ((await handle.queryPermission(opts)) === 'granted') {
      return true;
    }
    if ((await handle.requestPermission(opts)) === 'granted') {
      return true;
    }
    return false;
  }

  private async clearSavedDirectory(): Promise<void> {
    this.directoryHandle.set(null);
    await idbClear();
  }

  private fallbackDownload(content: string, fileName: string): void {
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
