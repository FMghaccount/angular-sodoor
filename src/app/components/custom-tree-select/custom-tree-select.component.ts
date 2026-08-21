import { Component, Input, forwardRef, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-custom-tree-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomTreeSelectComponent),
      multi: true
    }
  ],
  templateUrl: './custom-tree-select.component.html',
  styleUrls: ['./custom-tree-select.component.scss']
})
export class CustomTreeSelectComponent implements ControlValueAccessor {
  @Input() nodes: TreeNode[] = [];
  @Input() placeholder: string = 'انتخاب کنید';

  selectedNode: TreeNode | null = null;
  isOpen: boolean = false;

  private onChange = (val: any) => {};
  private onTouched = () => {};

  constructor(private elementRef: ElementRef) {}

  writeValue(value: any): void {
    this.selectedNode = value || null;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {}

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  hasChildren(node: TreeNode): boolean {
    return Array.isArray(node?.children) && node.children.length > 0;
  }

  expandNode(node: TreeNode): void {
    if (this.hasChildren(node)) {
      node.expanded = true;
    }
  }

  toggleExpand(node: TreeNode, event: Event): void {
    event.stopPropagation();
    if (this.hasChildren(node)) {
      node.expanded = !node.expanded;
    }
  }

  // --- Strict Leaf-Only Selection Restriction ---
  onNodeClick(node: TreeNode, event: Event): void {
    event.stopPropagation();

    if (this.hasChildren(node)) {
      // node.expanded = !node.expanded;
      return; // Do NOT select parent nodes
    }

    // Leaf node selection
    this.selectedNode = node;
    this.onChange(node);
    this.isOpen = false;
  }
}
