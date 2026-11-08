import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TuiAnimated } from '@taiga-ui/cdk';
import { AuthService } from '../../services/auth.service';
import { CreatePostComponent } from '../../shared/create-post/create-post.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, RouterModule, CreatePostComponent, TuiAnimated]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('section2') section2!: ElementRef;
  @ViewChild('section3') section3!: ElementRef;

  successMessage: string | null = null;
  sec2Visible = false;
  sec3Visible = false;
  private observer?: IntersectionObserver;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === this.section2.nativeElement) {
              this.sec2Visible = true;
            }
            if (entry.target === this.section3.nativeElement) {
              this.sec3Visible = true;
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    if (this.section2) this.observer.observe(this.section2.nativeElement);
    if (this.section3) this.observer.observe(this.section3.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onPostCreated(): void {
    this.successMessage = 'Ваш пост успешно опубликован!';
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }
}
