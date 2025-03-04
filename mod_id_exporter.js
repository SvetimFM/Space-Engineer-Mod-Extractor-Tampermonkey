// ==UserScript==
// @name         Enhanced Steam Workshop Subscription Exporter
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Exports Steam Workshop subscriptions to XML or CSV format with item selection
// @author       Aleksander Allen, Claude 3.7
// @match        *://steamcommunity.com/id/*/myworkshopfiles/*
// @match        *://steamcommunity.com/profiles/*/myworkshopfiles/*
// @grant        GM_setClipboard
// ==/UserScript==

(function(){
    // Main styles for the widget
    const styles = `
      .subscription-exporter {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #1b2838;
        border: 1px solid #66c0f4;
        border-radius: 4px;
        padding: 15px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        color: white;
        font-family: Arial, sans-serif;
        max-width: 350px;
        text-align: center;
        transition: all 0.3s ease;
      }
      .exporter-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #66c0f4;
      }
      .export-btn, .copy-btn, .toggle-list-btn, .select-btn {
        padding: 8px 12px;
        margin: 5px;
        cursor: pointer;
        border: none;
        border-radius: 3px;
        font-weight: bold;
        transition: background-color 0.2s;
      }
      .export-btn {
        background-color: #66c0f4;
        color: #1b2838;
      }
      .export-btn:hover {
        background-color: #4da5e6;
      }
      .copy-btn {
        background-color: #5c7e10;
        color: white;
      }
      .copy-btn:hover {
        background-color: #4e6a0d;
      }
      .toggle-list-btn {
        background-color: #2a475e;
        color: white;
        width: 100%;
        margin: 10px 0 5px 0;
      }
      .toggle-list-btn:hover {
        background-color: #386081;
      }
      .select-btn {
        background-color: #2a3f5f;
        color: white;
        font-size: 12px;
        padding: 5px 8px;
      }
      .select-btn:hover {
        background-color: #386081;
      }
      .format-select {
        padding: 6px 10px;
        background-color: #2a3f5f;
        color: white;
        border: 1px solid #66c0f4;
        border-radius: 3px;
        margin: 5px 0;
        width: 100%;
      }
      .notification {
        margin-top: 10px;
        font-size: 12px;
        color: #66c0f4;
        height: 15px;
      }
      .mod-list {
        max-height: 300px;
        overflow-y: auto;
        margin-top: 10px;
        text-align: left;
        border-top: 1px solid #366b96;
        padding-top: 10px;
      }
      .mod-list-item {
        padding: 5px;
        border-bottom: 1px solid #366b96;
        display: flex;
        align-items: center;
      }
      .mod-list-item:last-child {
        border-bottom: none;
      }
      .mod-checkbox {
        margin-right: 8px;
      }
      .mod-title {
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mod-id {
        font-size: 10px;
        color: #8b9bb7;
        margin-left: 5px;
      }
      .selection-controls {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      .count-badge {
        background-color: #66c0f4;
        color: #1b2838;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 11px;
        margin-left: 5px;
        display: inline-block;
      }
      /* Custom scrollbar */
      .mod-list::-webkit-scrollbar {
        width: 8px;
      }
      .mod-list::-webkit-scrollbar-track {
        background: #1b2838;
      }
      .mod-list::-webkit-scrollbar-thumb {
        background-color: #366b96;
        border-radius: 4px;
      }
      /* Toggle checkbox styles */
      .toggle-checkbox {
        appearance: none;
        width: 40px;
        height: 20px;
        background-color: #2a3f5f;
        border-radius: 10px;
        position: relative;
        cursor: pointer;
        outline: none;
        transition: background-color 0.3s;
      }
      .toggle-checkbox:checked {
        background-color: #5c7e10;
      }
      .toggle-checkbox:before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: white;
        transition: transform 0.3s;
      }
      .toggle-checkbox:checked:before {
        transform: translateX(20px);
      }
      .toggle-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 10px 0;
      }
      .toggle-label {
        font-size: 12px;
        margin-right: 10px;
      }
    `;
  
    let allItems = []; // Store all collected items
    let listVisible = false;
  
    // Helper function to trigger download of a text file
    function downloadFile(filename, content) {
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
      element.setAttribute('download', filename);
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  
    // Function to collect subscription data
    function collectSubscriptionData() {
      // Different pages might use different selectors, so we'll try a few common ones
      let subscriptionItems = [];
  
      // Try different selectors that might contain workshop items
      const selectors = [
        '.workshopItemSubscription',
        '.workshopItem',
        '.workshop_item'
      ];
  
      // Use the first selector that returns items
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          subscriptionItems = elements;
          break;
        }
      }
  
      if (subscriptionItems.length === 0) {
        showNotification("No subscribed items found. Make sure you are on the subscriptions page.");
        return null;
      }
  
      // Use a Map to store items by ID to prevent duplicates
      const itemsMap = new Map();
  
      subscriptionItems.forEach(function(item) {
        // Get the title
        const titleElem = item.querySelector('.workshopItemTitle');
        const title = titleElem ? titleElem.innerText.trim() : "Unknown Title";
  
        // Get the first link in the subscription item - only get the item link, not other links
        const linkElem = item.querySelector('a[href*="filedetails"]') || item.querySelector('a');
        if (!linkElem) return; // Skip if no link found
  
        const link = linkElem.href;
  
        // Extract the published file ID from the link
        let publishedFileId = "";
        if (link) {
          // Pattern for filedetails URLs: https://steamcommunity.com/sharedfiles/filedetails/?id=3317449166
          let match = link.match(/[?&]id=(\d+)/);
          if (match && match[1]) {
            publishedFileId = match[1];
          } else {
            // Fallback pattern for other URL formats that might contain the ID
            match = link.match(/\/(\d+)(?:\/|$)/);
            if (match && match[1]) {
              publishedFileId = match[1];
            }
          }
        }
  
        if (publishedFileId && !itemsMap.has(publishedFileId)) {
          // Only add the item if we haven't seen this ID before
          itemsMap.set(publishedFileId, {
            title: title,
            id: publishedFileId,
            selected: true // Default to selected
          });
        }
      });
  
      // Convert the Map values to an array
      return Array.from(itemsMap.values());
    }
  
    // Function to generate XML format
    function generateXML(items) {
      let xmlOutput = "";
  
      items.forEach(function(item) {
        xmlOutput += `    <ModItem FriendlyName="${escapeXml(item.title)}">\n`;
        xmlOutput += `      <Name>${item.id}.sbm</Name>\n`;
        xmlOutput += `      <PublishedFileId>${item.id}</PublishedFileId>\n`;
        xmlOutput += `      <PublishedServiceName>Steam</PublishedServiceName>\n`;
        xmlOutput += `    </ModItem>\n`;
      });
  
      return xmlOutput;
    }
  
    // Function to generate CSV format
    function generateCSV(items) {
      let csvOutput = "FriendlyName,Name,PublishedFileId,PublishedServiceName\n";
  
      items.forEach(function(item) {
        csvOutput += `"${escapeCSV(item.title)}",${item.id}.sbm,${item.id},Steam\n`;
      });
  
      return csvOutput;
    }
  
    // Helper function to escape XML special characters
    function escapeXml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    }
  
    // Helper function to escape CSV special characters
    function escapeCSV(unsafe) {
      if (unsafe.includes('"') || unsafe.includes(',')) {
        return unsafe.replace(/"/g, '""');
      }
      return unsafe;
    }
  
    // Function to show notification in the widget
    function showNotification(message) {
      const notification = document.querySelector('.notification');
      if (notification) {
        notification.textContent = message;
  
        // Clear notification after 3 seconds
        setTimeout(() => {
          notification.textContent = '';
        }, 3000);
      }
    }
  
    // Function to get selected items
    function getSelectedItems() {
      if (!allItems || allItems.length === 0) return [];
  
      // If list is not visible (or not yet created), return all items that were set as selected
      if (!listVisible) {
        return allItems.filter(item => item.selected);
      }
  
      // Otherwise, get the current state from the checkboxes
      const selectedItems = [];
      const checkboxes = document.querySelectorAll('.mod-checkbox');
  
      checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked && index < allItems.length) {
          selectedItems.push(allItems[index]);
        }
      });
  
      return selectedItems;
    }
  
    // Function to handle export
    function handleExport() {
      const selectedItems = getSelectedItems();
      if (!selectedItems || selectedItems.length === 0) {
        showNotification("No items selected to export");
        return;
      }
  
      const formatSelect = document.querySelector('.format-select');
      const format = formatSelect.value;
  
      let content = '';
      let filename = '';
  
      if (format === 'xml') {
        content = generateXML(selectedItems);
        filename = 'steam_mods.xml';
      } else if (format === 'csv') {
        content = generateCSV(selectedItems);
        filename = 'steam_mods.csv';
      }
  
      downloadFile(filename, content);
      showNotification(`Exported ${selectedItems.length} selected items as ${format.toUpperCase()}`);
    }
  
    // Function to handle clipboard copy
    function handleCopy() {
      const selectedItems = getSelectedItems();
      if (!selectedItems || selectedItems.length === 0) {
        showNotification("No items selected to copy");
        return;
      }
  
      const formatSelect = document.querySelector('.format-select');
      const format = formatSelect.value;
  
      let content = '';
  
      if (format === 'xml') {
        content = generateXML(selectedItems);
      } else if (format === 'csv') {
        content = generateCSV(selectedItems);
      }
  
      // Copy to clipboard
      try {
        if (typeof GM_setClipboard === 'function') {
          GM_setClipboard(content);
        } else {
          navigator.clipboard.writeText(content).catch(err => {
            throw new Error('Clipboard API failed');
          });
        }
        showNotification(`Copied ${selectedItems.length} selected items to clipboard`);
      } catch (error) {
        console.error('Failed to copy: ', error);
        showNotification('Failed to copy to clipboard');
      }
    }
  
    // Function to toggle item selection list
    function toggleItemList() {
      const modList = document.querySelector('.mod-list');
      const toggleBtn = document.querySelector('.toggle-list-btn');
      const widget = document.querySelector('.subscription-exporter');
  
      if (!modList) {
        // First time opening the list, need to create it
        if (!allItems || allItems.length === 0) {
          allItems = collectSubscriptionData();
          if (!allItems) return;
        }
  
        createItemList(allItems);
        listVisible = true;
        toggleBtn.textContent = 'Hide Mod List';
      } else {
        // Toggle visibility
        if (modList.style.display === 'none') {
          modList.style.display = 'block';
          listVisible = true;
          toggleBtn.textContent = 'Hide Mod List';
        } else {
          modList.style.display = 'none';
          listVisible = false;
          toggleBtn.textContent = 'Show Mod List';
        }
      }
    }
  
    // Function to create the item selection list
    function createItemList(items) {
      const widget = document.querySelector('.subscription-exporter');
  
      // Create selection controls
      const selectionControls = document.createElement('div');
      selectionControls.className = 'selection-controls';
  
      const selectAllBtn = document.createElement('button');
      selectAllBtn.className = 'select-btn';
      selectAllBtn.textContent = 'Select All';
      selectAllBtn.addEventListener('click', () => selectAll(true));
  
      const deselectAllBtn = document.createElement('button');
      deselectAllBtn.className = 'select-btn';
      deselectAllBtn.textContent = 'Deselect All';
      deselectAllBtn.addEventListener('click', () => selectAll(false));
  
      selectionControls.appendChild(selectAllBtn);
      selectionControls.appendChild(deselectAllBtn);
  
      // Create mod list container
      const modList = document.createElement('div');
      modList.className = 'mod-list';
  
      // Add items to list
      items.forEach((item, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'mod-list-item';
  
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'mod-checkbox';
        checkbox.checked = item.selected;
        checkbox.setAttribute('data-index', index);
        checkbox.addEventListener('change', () => {
          allItems[index].selected = checkbox.checked;
          updateSelectedCount();
        });
  
        const titleSpan = document.createElement('span');
        titleSpan.className = 'mod-title';
        titleSpan.textContent = item.title;
  
        const idSpan = document.createElement('span');
        idSpan.className = 'mod-id';
        idSpan.textContent = `(${item.id})`;
  
        listItem.appendChild(checkbox);
        listItem.appendChild(titleSpan);
        listItem.appendChild(idSpan);
        modList.appendChild(listItem);
      });
  
      // Add controls and list to widget
      widget.appendChild(selectionControls);
      widget.appendChild(modList);
  
      // Add a filter option
      const filterContainer = document.createElement('div');
      filterContainer.className = 'toggle-container';
  
      const filterLabel = document.createElement('span');
      filterLabel.className = 'toggle-label';
      filterLabel.textContent = 'Search:';
  
      const filterInput = document.createElement('input');
      filterInput.type = 'text';
      filterInput.placeholder = 'Filter mods...';
      filterInput.style.width = '100%';
      filterInput.style.padding = '5px';
      filterInput.style.backgroundColor = '#2a3f5f';
      filterInput.style.color = 'white';
      filterInput.style.border = '1px solid #366b96';
      filterInput.style.borderRadius = '3px';
      filterInput.addEventListener('input', (e) => {
        filterItems(e.target.value.toLowerCase());
      });
  
      filterContainer.appendChild(filterLabel);
      filterContainer.appendChild(filterInput);
  
      // Insert filter before mod list
      widget.insertBefore(filterContainer, modList);
  
      // Add count badge to title
      const title = document.querySelector('.exporter-title');
      const countBadge = document.createElement('span');
      countBadge.className = 'count-badge';
      countBadge.textContent = `${items.length} mods`;
      title.appendChild(countBadge);
  
      updateSelectedCount();
    }
  
    // Function to filter items in the list
    function filterItems(query) {
      const listItems = document.querySelectorAll('.mod-list-item');
      let visibleCount = 0;
  
      listItems.forEach((item, index) => {
        const title = item.querySelector('.mod-title').textContent.toLowerCase();
        const id = item.querySelector('.mod-id').textContent.toLowerCase();
  
        if (title.includes(query) || id.includes(query)) {
          item.style.display = 'flex';
          visibleCount++;
        } else {
          item.style.display = 'none';
        }
      });
    }
  
    // Function to select/deselect all items
    function selectAll(select) {
      const checkboxes = document.querySelectorAll('.mod-checkbox');
  
      checkboxes.forEach((checkbox, index) => {
        checkbox.checked = select;
        if (index < allItems.length) {
          allItems[index].selected = select;
        }
      });
  
      updateSelectedCount();
    }
  
    // Function to update the selected count
    function updateSelectedCount() {
      const selectedItems = getSelectedItems();
      const countBadge = document.querySelector('.count-badge');
  
      if (countBadge) {
        countBadge.textContent = `${selectedItems.length}/${allItems.length} mods`;
      }
    }
  
    // Create and add the exporter widget to the page
    function addExporterWidget() {
      // Add styles to the page
      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
  
      // Create widget container
      const widget = document.createElement('div');
      widget.className = 'subscription-exporter';
  
      // Create widget content
      widget.innerHTML = `
        <div class="exporter-title">Workshop Exporter</div>
        <select class="format-select">
          <option value="xml">XML Format</option>
          <option value="csv">CSV Format</option>
        </select>
        <div>
          <button class="export-btn">Download</button>
          <button class="copy-btn">Copy to Clipboard</button>
        </div>
        <button class="toggle-list-btn">Show Mod List</button>
        <div class="notification"></div>
      `;
  
      // Add event listeners
      widget.querySelector('.export-btn').addEventListener('click', handleExport);
      widget.querySelector('.copy-btn').addEventListener('click', handleCopy);
      widget.querySelector('.toggle-list-btn').addEventListener('click', toggleItemList);
  
      // Add widget to the page
      document.body.appendChild(widget);
  
      // Prefetch items
      setTimeout(() => {
        allItems = collectSubscriptionData();
      }, 1000);
    }
  
    // Initialize the script when the page has loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addExporterWidget);
    } else {
      addExporterWidget();
    }
  })();