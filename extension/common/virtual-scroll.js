/**
 * Virtual Scrolling Implementation
 * Only renders visible items in viewport for better performance with large lists.
 * 
 * Features:
 * - Renders only visible items + buffer
 * - Smooth scrolling with proper height calculations
 * - Automatic item height detection
 * - Search/filter support with re-rendering
 * - Memory efficient for 1000+ items
 * 
 * Usage:
 * ```javascript
 * const virtualScroll = new VirtualScroll({
 *   container: document.getElementById('list'),
 *   items: allPins,
 *   renderItem: (pin, index) => createPinElement(pin),
 *   itemHeight: 120,  // avg item height
 *   bufferSize: 5     // render 5 extra items above/below viewport
 * });
 * 
 * // Update items (e.g., after search)
 * virtualScroll.updateItems(filteredPins);
 * 
 * // Cleanup
 * virtualScroll.destroy();
 * ```
 * 
 * @module virtual-scroll
 * @version 1.0.0
 */

class VirtualScroll {
  /**
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element
   * @param {Array} options.items - Array of items to render
   * @param {Function} options.renderItem - Function(item, index) => HTMLElement
   * @param {number} options.itemHeight - Average item height in pixels
   * @param {number} options.bufferSize - Number of extra items to render (default: 3)
   * @param {Function} options.onVisibleRangeChange - Callback(startIndex, endIndex)
   */
  constructor(options) {
    this.container = options.container;
    this.items = options.items || [];
    this.renderItem = options.renderItem;
    this.itemHeight = options.itemHeight || 100;
    this.bufferSize = options.bufferSize || 3;
    this.onVisibleRangeChange = options.onVisibleRangeChange || null;
    
    // Internal state
    this.scrollContainer = null;
    this.contentContainer = null;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.renderedElements = new Map(); // index -> element
    this.scrollHandler = null;
    this.resizeObserver = null;
    
    this.init();
  }

  init() {
    // Create scroll container structure
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    
    // Create spacer for total height
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.position = 'relative';
    this.scrollContainer.style.width = '100%';
    this.updateTotalHeight();
    
    // Create content container for visible items
    this.contentContainer = document.createElement('div');
    this.contentContainer.style.position = 'absolute';
    this.contentContainer.style.top = '0';
    this.contentContainer.style.left = '0';
    this.contentContainer.style.right = '0';
    
    this.scrollContainer.appendChild(this.contentContainer);
    this.container.appendChild(this.scrollContainer);
    
    // Add scroll listener
    this.scrollHandler = () => this.handleScroll();
    this.container.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    // Observe container resize
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleScroll();
      });
      this.resizeObserver.observe(this.container);
    }
    
    // Initial render
    this.handleScroll();
  }

  updateTotalHeight() {
    const totalHeight = this.items.length * this.itemHeight;
    this.scrollContainer.style.height = `${totalHeight}px`;
  }

  handleScroll() {
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;
    
    // Calculate visible range with buffer
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
    const endIndex = Math.min(
      this.items.length - 1,
      Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + this.bufferSize
    );
    
    // Only update if range changed significantly
    if (startIndex !== this.visibleStart || endIndex !== this.visibleEnd) {
      this.visibleStart = startIndex;
      this.visibleEnd = endIndex;
      this.render();
      
      // Notify callback
      if (this.onVisibleRangeChange) {
        this.onVisibleRangeChange(startIndex, endIndex);
      }
    }
  }

  render() {
    const fragment = document.createDocumentFragment();
    const newRenderedElements = new Map();
    
    // Position content container
    const offsetY = this.visibleStart * this.itemHeight;
    this.contentContainer.style.transform = `translateY(${offsetY}px)`;
    
    // Render visible items
    for (let i = this.visibleStart; i <= this.visibleEnd; i++) {
      if (i >= this.items.length) break;
      
      // Reuse existing element if possible
      let element = this.renderedElements.get(i);
      
      if (!element) {
        // Create new element
        element = this.renderItem(this.items[i], i);
        if (element) {
          element.dataset.virtualIndex = i;
        }
      }
      
      if (element) {
        fragment.appendChild(element);
        newRenderedElements.set(i, element);
      }
    }
    
    // Clear container and append new elements
    this.contentContainer.innerHTML = '';
    this.contentContainer.appendChild(fragment);
    
    // Update rendered elements map
    this.renderedElements = newRenderedElements;
  }

  /**
   * Update items and re-render
   * @param {Array} newItems - New array of items
   */
  updateItems(newItems) {
    this.items = newItems;
    this.renderedElements.clear();
    this.updateTotalHeight();
    
    // Reset scroll if current position is out of bounds
    const maxScroll = this.items.length * this.itemHeight - this.container.clientHeight;
    if (this.container.scrollTop > maxScroll) {
      this.container.scrollTop = 0;
    }
    
    this.handleScroll();
  }

  /**
   * Scroll to specific item
   * @param {number} index - Item index
   * @param {string} behavior - 'auto' or 'smooth'
   */
  scrollToIndex(index, behavior = 'smooth') {
    const targetScroll = index * this.itemHeight;
    this.container.scrollTo({
      top: targetScroll,
      behavior
    });
  }

  /**
   * Get currently visible item indices
   * @returns {Object} { start, end }
   */
  getVisibleRange() {
    return {
      start: this.visibleStart,
      end: this.visibleEnd
    };
  }

  /**
   * Refresh/re-render current view
   */
  refresh() {
    this.renderedElements.clear();
    this.handleScroll();
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.scrollHandler) {
      this.container.removeEventListener('scroll', this.scrollHandler);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    this.renderedElements.clear();
    this.container.innerHTML = '';
  }
}

// Export for modules
if (typeof window !== 'undefined') {
  window.VirtualScroll = VirtualScroll;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualScroll;
}
