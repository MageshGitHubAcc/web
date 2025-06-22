import { Component, ElementRef, HostListener, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css'],

})
export class GalleryComponent implements OnInit {
  images = [
    'assets/images/photo1.jpg',
    'assets/images/photo2.jpg',
    'assets/images/photo3.jpg',
    'assets/images/photo4.jpg',
    'assets/images/photo5.jpg',
    'assets/images/photo6.jpg',
    'assets/images/photo7.jpg',
    'assets/images/photo8.jpg',
    'assets/images/photo9.jpg',
    'assets/images/photo10.jpg'
  ];

  currentIndex = 0;
  startX = 0;
  currentX = 0;
  isDragging = false;
  translateX = 0;
  dragDistance = 0;
  exactPosition = 0;

  @ViewChild('sliderTrack') sliderTrack!: ElementRef;
  @ViewChild('galleryContainer') galleryContainer!: ElementRef;

  constructor(private renderer: Renderer2, private route: Router) {

  }


  ngOnInit(): void { }

  // Combined drag start handler for both touch and mouse
  onDragStart(event: TouchEvent | MouseEvent): void {
    this.isDragging = true;
    this.startX = this.getClientX(event);
    this.currentX = this.startX;
    this.dragDistance = 0;

    // Prevent default only for touch events to avoid scrolling
    if (event instanceof TouchEvent) {
      event.preventDefault();
    }

    this.renderer.addClass(this.sliderTrack.nativeElement, 'no-transition');
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length > 1) return;

    event.preventDefault();
    this.handleDragMove(event.touches[0].clientX);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.handleDragMove(event.clientX);
  }

  private handleDragMove(clientX: number): void {
    const diff = clientX - this.currentX;
    this.dragDistance += Math.abs(diff);
    this.translateX = (-this.currentIndex * 100) + (diff / this.getGalleryWidth() * 100);
    this.exactPosition = this.currentIndex - (diff / this.getGalleryWidth());
    this.updateSliderPosition();
    this.currentX = clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.handleDragEnd();
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('mouseleave', ['$event'])
  onMouseEnd(event: MouseEvent): void {
    this.handleDragEnd();
  }

  private handleDragEnd(): void {
    if (!this.isDragging) return;

    this.renderer.removeClass(this.sliderTrack.nativeElement, 'no-transition');
    const diffX = this.startX - this.currentX;

    if (this.dragDistance > 30) {
      if (diffX > 50) {
        this.next();
      } else if (diffX < -50) {
        this.prev();
      } else {
        this.snapToNearestSlide();
      }
    } else {
      this.snapToNearestSlide();
    }

    this.isDragging = false;
  }

  private snapToNearestSlide(): void {
    const newIndex = Math.round(this.exactPosition);
    this.goTo(Math.max(0, Math.min(newIndex, this.images.length - 1)));
  }

  private getClientX(event: TouchEvent | MouseEvent): number {
    return event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
  }

  private getGalleryWidth(): number {
    return this.galleryContainer?.nativeElement?.clientWidth || window.innerWidth;
  }

  private updateSliderPosition(): void {
    this.renderer.setStyle(
      this.sliderTrack.nativeElement,
      'transform',
      `translateX(${this.translateX}%)`
    );
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.animateSlideTransition();
    }
  }

  next(): void {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.animateSlideTransition();
    }
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.images.length) {
      this.currentIndex = index;
      this.animateSlideTransition();
    }
  }

  private animateSlideTransition(): void {
    this.translateX = -this.currentIndex * 100;
    this.updateSliderPosition();
  }

  getMath() {
    return Math;
  }

  routeToAudio() {
    this.route.navigate(['audio'])
  }
}