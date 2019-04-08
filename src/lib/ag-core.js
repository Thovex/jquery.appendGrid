﻿// import dependencies
import IconDefault from './ag-icon-default';
import IconFontAwesome5 from './ag-icon-fontawesome5';
import IconMaterialDesignIcons3 from './ag-icon-materialdesignicons3';
import IconIonicons4 from './ag-icon-ionicons4';
import IconTypicons2 from './ag-icon-typicons2';
import IconOpenIconic from './ag-icon-openiconic';
import UiDefault from './ag-ui-default';
import UiBootstrap4 from './ag-ui-bootstrap4';
import UiBulma from './ag-ui-bulma';
import UiFoundation6 from './ag-ui-foundation6';
import * as Util from './ag-util';

class GridCore {

    constructor(options) {
        // Define *self* variable that will not mix with the *this* in event handlers
        const self = this;

        // Define private variables
        Object.assign(self, {
            // The UniqueIndex accumulate counter
            uniqueIndex: 0,
            // The row order array
            rowOrder: [],
            // Indicate data is loaded or not
            isDataLoaded: false,
            // Visible column count for internal calculation
            visibleCount: 0,
            // Total colSpan count after excluding `hideRowNumColumn` and not generating last column
            finalColSpan: 0,
            // Indicate to hide last column or not
            hideLastColumn: false,
            // The element ID of the `appendGrid` wrapper
            wrapperId: null,
            // Indicate calculate width or not
            // calculateWidth: true,
            // Settings
            settings: null,
            // The table element
            tbWhole: null,
            // The table body element
            tbBody: null,
            // Icon Framework object to be used
            iconFramework: null,
            // UI Framework object to be used
            uiFramework: null
        });

        // Merge default options
        let settings = Object.assign({}, options);
        self.settings = settings;
        console.debug('ag:Options initialized');

        // Check the table element
        let tbWhole = settings.element;
        if (!tbWhole || !tbWhole.tagName || tbWhole.tagName !== 'TABLE') {
            throw '*element* is not defined or is not a table DOM element.';
        }
        self.tbWhole = tbWhole;
        tbWhole.innerHTML = '';
        console.debug('ag:Checked element');

        // Check Icon framework
        if (settings.iconFramework === 'fontawesome5') {
            self.iconFramework = new IconFontAwesome5(settings.iconParams);
        } else if (settings.iconFramework === 'ionicon4') {
            self.iconFramework = new IconIonicons4(settings.iconParams);
        } else if (settings.iconFramework === 'materialdesignicons3') {
            self.iconFramework = new IconMaterialDesignIcons3(settings.iconParams);
        } else if (settings.iconFramework === 'openiconic') {
            self.iconFramework = new IconOpenIconic(settings.iconParams);
        } else if (settings.iconFramework === 'typicons2') {
            self.iconFramework = new IconTypicons2(settings.iconParams);
        } else if (!settings.iconFramework || settings.iconFramework === 'default') {
            self.iconFramework = new IconDefault(settings.iconParams);
        } else {
            throw `Unknown Icon framework *${settings.iconFramework}*.`;
        }
        console.debug('ag:Checked icon framework');

        // Check UI framework
        if (settings.uiFramework === 'bootstrap4') {
            self.uiFramework = new UiBootstrap4(settings.uiParams, self.iconFramework);
        } else if (settings.uiFramework === 'bulma') {
            self.uiFramework = new UiBulma(settings.uiParams, self.iconFramework);
        } else if (settings.uiFramework === 'foundation6') {
            self.uiFramework = new UiFoundation6(settings.uiParams, self.iconFramework);
        } else if (!settings.uiFramework || settings.uiFramework === 'default') {
            self.uiFramework = new UiDefault(settings.uiParams, self.iconFramework);
        } else {
            throw `Unknown UI framework *${settings.uiFramework}*.`;
        }
        console.debug('ag:Checked ui framework');

        // Check `idPrefix` is defined
        if (Util.isEmpty(settings.idPrefix)) {
            // Check table ID defined
            if (!tbWhole.id) {
                // Generate an ID using current time
                settings.idPrefix = 'ag' + new Date().getTime();
            }
            else {
                settings.idPrefix = tbWhole.id;
            }
            console.debug(`*idPrefix* = ${settings.idPrefix}`);
        }

        // Assign custom section classes
        if (settings.sectionClasses) {
            self.uiFramework.applySectionClasses(settings.sectionClasses);
        }

        // Config table element
        Util.applyClasses(tbWhole, self.uiFramework.getSectionClasses('table'));

        // Create wrapper
        let wrapper = self.createElement('div', 'wrapper');
        tbWhole.parentNode.insertBefore(wrapper, tbWhole);
        wrapper.appendChild(tbWhole);

        // Create thead
        let thead = self.createElement('thead');
        tbWhole.appendChild(thead);
        let tRow = self.createElement('tr', 'theadRow');
        thead.appendChild(tRow);
        let tCell = self.createElement('th', 'theadCell');
        tRow.appendChild(tCell);
        for (let z = 0; z < settings.columns.length; z++) {
            tCell = self.createElement('th', 'theadCell');
            tCell.innerText = settings.columns[z].display;
            tRow.appendChild(tCell);
        }
        tCell = self.createElement('th', 'theadCell');
        tRow.appendChild(tCell);

        // Create tbody
        let tbBody = self.createElement('tbody');
        tbWhole.appendChild(tbBody);
        tRow = self.createElement('tr', 'tbodyRow');
        tbBody.appendChild(tRow);
        tCell = self.createElement('td', 'tbodyCell');
        tCell.colSpan = settings.columns.length + 2;
        tRow.appendChild(tCell);
        self.tbBody = tbBody;

        // Create tfoot
        let tfoot = self.createElement('tfoot');
        tbWhole.appendChild(tfoot);
        tRow = self.createElement('tr', 'tfootRow');
        tfoot.appendChild(tRow);
        tCell = self.createElement('td', 'tfootCell');
        tCell.colSpan = settings.columns.length + 2;
        tRow.appendChild(tCell);

        // Create button group, if defined
        let buttonContainer = self.uiFramework.createButtonGroup();
        if (buttonContainer) {
            tCell.appendChild(buttonContainer);
        } else {
            buttonContainer = tCell;
        }
        let appendButton = self.uiFramework.generateButton(buttonContainer, 'append');
        appendButton.addEventListener('click', function (evt) {
            self.insertRow(1);
        });
        let removeLastButton = self.uiFramework.generateButton(buttonContainer, 'removeLast');
        removeLastButton.addEventListener('click', function (evt) {
            self.removeRow();
        });

        // Save settings
        self.settings = settings;

        // Load init data if defined
        if (Array.isArray(settings.initData)) {
            // Load data if initData is array
            self.loadData(settings.initData, true);
        } else {
            // Add empty rows
            self.insertRow(settings.initRows);
        }

        console.debug('ag:Initialized');
    }

    createElement(elementName, sectionName) {
        let element = document.createElement(elementName);
        let classNames = this.uiFramework.getSectionClasses(sectionName || elementName);
        Util.applyClasses(element, classNames);
        return element;
    }

    loadData(records, isInit) {
        if (!Array.isArray(records) || !records.length) {
            throw '*records* should be in array format!';
        }

        // Clear existing content
        let self = this;
        let settings = self.settings;
        // let tbRow, tbCell;
        self.tbBody.innerHTML = '';
        self.rowOrder.length = 0;
        self.uniqueIndex = 0;

        // Add rows
        let insertResult = self.insertRow(records.length);

        // Set data
        for (let r = 0; r < insertResult.addedRows.length; r++) {
            for (let c = 0; c < settings.columns.length; c++) {
                self.setCtrlValue(c, self.rowOrder[r], records[r][settings.columns[c].name]);
            }
            /*
            if ($.isFunction(settings.rowDataLoaded)) {
                settings.rowDataLoaded(tbWhole, records[r], r, settings._rowOrder[r]);
            }
            */
        }

        // Save setting
        self.isDataLoaded = true;

        // Clear initData
        if (isInit) self.settings.initData = null;

        // Trigger data loaded event
        /*
        if ($.isFunction(settings.dataLoaded)) {
            settings.dataLoaded(tbWhole, records);
        }
        */
    }

    insertRow(numOfRowOrRowArray, rowIndex, callerUniqueIndex) {
        // Define variables
        let self = this;
        let settings = self.settings, uiFramework = self.uiFramework, tbBody = self.tbBody, tbRow, tbCell;
        let addedRows = [], parentIndex = null, uniqueIndex, hiddenColumns = [];
        // let tbWhole = self.tbWhole, tbSubRow = null, reachMaxRow = false, calColWidth = false
        // let oldHeight = 0, oldScroll = 0;
        // Check number of row to be inserted
        let numOfRow = numOfRowOrRowArray, loadData = false;
        if (Array.isArray(numOfRowOrRowArray)) {
            numOfRow = numOfRowOrRowArray.length;
            loadData = true;
        }
        // Check parent row
        if (Util.isNumeric(callerUniqueIndex)) {
            for (let z = 0; z < self.rowOrder.length; z++) {
                if (self.rowOrder[z] === callerUniqueIndex) {
                    rowIndex = z;
                    if (z !== 0) parentIndex = z - 1;
                    break;
                }
            }
        }
        else if (Util.isNumeric(rowIndex)) {
            if (rowIndex >= self.rowOrder.length) {
                rowIndex = null;
            } else {
                parentIndex = rowIndex - 1;
            }
        }
        else if (self.rowOrder.length !== 0) {
            rowIndex = null;
            parentIndex = self.rowOrder.length - 1;
        }
        // Store old grid height
        /*
        if (settings.maintainScroll && !$.isNumeric(rowIndex)) {
            oldHeight = $(tbWhole).height();
            oldScroll = $(tbWhole).scrollParent().scrollTop();
        }
        */
        // Remove empty row
        if (self.rowOrder.length === 0) {
            tbBody.innerHTML = '';
            // calColWidth = true;
        }
        // Add total number of row
        for (let z = 0; z < numOfRow; z++) {
            // Check maximum number of rows
            /*
            if (0 < settings.maxRowsAllowed && settings._rowOrder.length >= settings.maxRowsAllowed) {
                reachMaxRow = true;
                break;
            }
            */
            // Update variables
            self.uniqueIndex++;
            uniqueIndex = self.uniqueIndex;
            hiddenColumns.length = 0;
            // Check row insert index
            if (Util.isNumeric(rowIndex)) {
                self.rowOrder.splice(rowIndex, 0, uniqueIndex);
                /*
                if (settings.useSubPanel) {
                    tbBody.insertBefore(tbSubRow = document.createElement('tr'), tbBody.childNodes[rowIndex * 2]);
                    tbBody.insertBefore(tbRow = document.createElement('tr'), tbBody.childNodes[rowIndex * 2]);
                } else {
                    tbBody.insertBefore(tbRow = document.createElement('tr'), tbBody.childNodes[rowIndex]);
                }
                */
                tbBody.insertBefore(tbRow = document.createElement('tr'), tbBody.childNodes[rowIndex]);
                addedRows.push(rowIndex);
            }
            else {
                self.rowOrder.push(uniqueIndex);
                tbBody.appendChild(tbRow = document.createElement('tr'));
                /*
                if (settings.useSubPanel) {
                    tbBody.appendChild(tbSubRow = document.createElement('tr'));
                }
                */
                addedRows.push(self.rowOrder.length - 1);
            }
            tbRow.id = settings.idPrefix + '_Row_' + uniqueIndex;
            tbRow.dataset.uniqueIndex = uniqueIndex;
            Util.applyClasses(tbRow, uiFramework.getSectionClasses('tbodyRow'));

            // Config on the sub panel row
            /*
            if (tbSubRow != null) {
                tbSubRow.id = settings.idPrefix + '_SubRow_' + uniqueIndex;
                $(tbSubRow).data('appendGrid', uniqueIndex);
                if (settings._sectionClasses.subPanel) {
                    tbSubRow.className = settings._sectionClasses.subPanel;
                }
            }
            */
            // Add row number
            if (!settings.hideRowNumColumn) {
                tbRow.appendChild(tbCell = document.createElement('td'));
                tbCell.id = settings.idPrefix + '_RowNum_' + uniqueIndex;
                tbCell.innerText = '' + self.rowOrder.length;
                // if (settings.useSubPanel) tbCell.rowSpan = 2;
            }
            // Process on each columns
            for (let y = 0; y < settings.columns.length; y++) {
                // Skip hidden
                if (settings.columns[y].type === 'hidden') {
                    hiddenColumns.push(y);
                    continue;
                }
                // Check column invisble
                // var className = 'ui-widget-content';
                // if (settings.columns[y].invisible) className += ' invisible';
                // Insert cell
                tbRow.appendChild(tbCell = document.createElement('td'));
                tbCell.id = settings.idPrefix + '_' + settings.columns[y].name + '_td_' + uniqueIndex;
                Util.applyClasses(tbCell, uiFramework.getSectionClasses('tbodyCell'), settings.columns[y].cellCss);
                // Create wrapper, if required
                let ctrlHolder = null;
                if (settings.columns[y].wrapper) {
                    if (typeof (settings.columns[y].wrapper) === 'function') {
                        // Create wrapper by custom function
                        ctrlHolder = settings.columns[y].wrapper();
                    } else if (settings.columns[y].wrapper.tagName) {
                        // Clone the wrapper element
                        ctrlHolder = settings.columns[y].wrapper.cloneNode(true);
                    }
                }
                if (ctrlHolder) {
                    tbCell.appendChild(ctrlHolder);
                } else {
                    ctrlHolder = tbCell;
                }
                // Prepare control id and name
                let ctrlId = settings.idPrefix + '_' + settings.columns[y].name + '_' + uniqueIndex, ctrlName;
                if (typeof (settings.nameFormatter) === 'function') {
                    ctrlName = settings.nameFormatter(settings.idPrefix, settings.columns[y].name, uniqueIndex);
                } else {
                    ctrlName = ctrlId;
                }
                // Check control type
                let ctrl = null;
                if (settings.columns[y].type === 'custom') {
                    if (typeof (settings.columns[y].customBuilder) === 'function') {
                        ctrl = settings.columns[y].customBuilder(ctrlHolder, settings.idPrefix, settings.columns[y].name, uniqueIndex);
                    }
                } else {
                    // Generate control
                    ctrl = self.uiFramework.generateControl(ctrlHolder, settings.columns[y], ctrlId, ctrlName);
                    // Add control attributes as needed
                    if (!Util.isEmpty(settings.columns[y].ctrlAttr)) {
                        for (let attrName in settings.columns[y].ctrlAttr) {
                            ctrl.setAttribute(attrName, settings.columns[y].ctrlAttr[attrName]);
                        }
                    }
                    // Add control CSS as needed
                    if (!Util.isEmpty(settings.columns[y].ctrlCss)) {
                        for (let cssName in settings.columns[y].ctrlCss) {
                            ctrl.style[cssName] = settings.columns[y].ctrlCss[cssName];
                        }
                    }
                    // Add control events as needed
                    if (settings.columns[y].events) {
                        ctrl.dataset.columnName = settings.columns[y].name;
                        ctrl.dataset.uniqueIndex = uniqueIndex;
                        for (let name in settings.columns[y].events) {
                            let ctrlHandler = settings.columns[y].events[name];
                            ctrl.addEventListener(name, function (evt) {
                                evt.columnName = evt.currentTarget.dataset.columnName;
                                evt.uniqueIndex = evt.currentTarget.dataset.uniqueIndex;
                                ctrlHandler(evt);
                            });
                        }
                    }
                }
                if (loadData) {
                    // Load data if needed
                    self.setCtrlValue(y, uniqueIndex, numOfRowOrRowArray[z][settings.columns[y].name]);
                } else if (!Util.isEmpty(settings.columns[y].value)) {
                    // Set default value
                    self.setCtrlValue(y, uniqueIndex, settings.columns[y].value);
                }
            }
            // Add button cell if needed
            if (!self.hideLastColumn || settings.columns.length > self.visibleCount) {
                if (!settings.rowButtonsInFront) {
                    tbRow.appendChild(tbCell = document.createElement('td'));
                } else if (!settings.hideRowNumColumn) {
                    tbRow.insertBefore(tbCell = document.createElement('td'), tbRow.childNodes[1]);
                } else {
                    tbRow.insertBefore(tbCell = document.createElement('td'), tbRow.firstChild);
                }
                tbCell.id = settings.idPrefix + '_last_td_' + uniqueIndex;
                Util.applyClasses(tbCell,
                    uiFramework.getSectionClasses('tbodyCell'),
                    uiFramework.getSectionClasses('last'));
                if (self.hideLastColumn) tbCell.style.display = 'none';
                // Check to use button group or not
                let container = uiFramework.createButtonGroup();
                if (container) {
                    tbCell.appendChild(container);
                } else {
                    container = tbCell;
                }
                // Add standard buttons
                ['insert', 'remove', 'moveUp', 'moveDown'].forEach(function (type) {
                    if (!settings.hideButtons[type]) {
                        let buttonId = settings.idPrefix + '_$' + type + '_' + uniqueIndex;
                        let button = uiFramework.generateButton(container, type, buttonId);
                        button.dataset.uniqueIndex = uniqueIndex;
                        button.addEventListener('click', function (evt) {
                            let callerUniqueIndex = parseInt(evt.currentTarget.dataset.uniqueIndex);
                            self.rowButtonActions(type, callerUniqueIndex);
                            // Prevent default
                            evt.preventDefault();
                            return false;
                        });
                    }
                });
                /*
                if (!settings.hideButtons.insert) {
                    var button = createGridButton(settings.customGridButtons.insert, 'ui-icon-arrowreturnthick-1-w')
                        .attr({ id: settings.idPrefix + '_Insert_' + uniqueIndex, title: settings._i18n.insert, tabindex: -1 })
                        .addClass('insert').data('appendGrid', { uniqueIndex: uniqueIndex })
                        .click(function (evt) {
                            var rowUniqueIndex = $(this).data('appendGrid').uniqueIndex;
                            $(tbWhole).appendGrid('insertRow', 1, null, rowUniqueIndex);
                            if (evt && evt.preventDefault) evt.preventDefault(settings._buttonClasses.insert);
                            return false;
                        }).appendTo(tbCell);
                    if (!isEmpty(settings._buttonClasses.insert)) button.addClass(settings._buttonClasses.insert);
                }
                if (!settings.hideButtons.remove) {
                    var button = createGridButton(settings.customGridButtons.remove, 'ui-icon-trash')
                        .attr({ id: settings.idPrefix + '_Delete_' + uniqueIndex, title: settings._i18n.remove, tabindex: -1 })
                        .addClass('remove').data('appendGrid', { uniqueIndex: uniqueIndex })
                        .click(function (evt) {
                            var rowUniqueIndex = $(this).data('appendGrid').uniqueIndex;
                            removeRow(tbWhole, null, rowUniqueIndex, false);
                            if (evt && evt.preventDefault) evt.preventDefault();
                            return false;
                        }).appendTo(tbCell);
                    if (!isEmpty(settings._buttonClasses.remove)) button.addClass(settings._buttonClasses.remove);
                }
                if (!settings.hideButtons.moveUp) {
                    var button = createGridButton(settings.customGridButtons.moveUp, 'ui-icon-arrowthick-1-n')
                        .attr({ id: settings.idPrefix + '_MoveUp_' + uniqueIndex, title: settings._i18n.moveUp, tabindex: -1 })
                        .addClass('moveUp').data('appendGrid', { uniqueIndex: uniqueIndex })
                        .click(function (evt) {
                            var rowUniqueIndex = $(this).data('appendGrid').uniqueIndex;
                            $(tbWhole).appendGrid('moveUpRow', null, rowUniqueIndex);
                            if (evt && evt.preventDefault) evt.preventDefault();
                            return false;
                        }).appendTo(tbCell);
                    if (!isEmpty(settings._buttonClasses.moveUp)) button.addClass(settings._buttonClasses.moveUp);
                }
                if (!settings.hideButtons.moveDown) {
                    var button = createGridButton(settings.customGridButtons.moveDown, 'ui-icon-arrowthick-1-s')
                        .attr({ id: settings.idPrefix + '_MoveDown_' + uniqueIndex, title: settings._i18n.moveDown, tabindex: -1 })
                        .addClass('moveDown').data('appendGrid', { uniqueIndex: uniqueIndex })
                        .click(function (evt) {
                            var rowUniqueIndex = $(this).data('appendGrid').uniqueIndex;
                            $(tbWhole).appendGrid('moveDownRow', null, rowUniqueIndex);
                            if (evt && evt.preventDefault) evt.preventDefault();
                            return false;
                        }).appendTo(tbCell);
                    if (!isEmpty(settings._buttonClasses.moveDown)) button.addClass(settings._buttonClasses.moveDown);
                }
                */
                // Handle row dragging
                /*
                if (settings.rowDragging) {
                    var button = $('<div/>').addClass('rowDrag ui-state-default ui-corner-all')
                        .attr('title', settings._i18n.rowDrag).append($('<div/>').addClass('ui-icon ui-icon-caret-2-n-s').append($('<span/>').addClass('ui-button-text').text('Drag')))
                        .appendTo(tbCell);
                    if (!isEmpty(settings._buttonClasses.rowDrag)) button.addClass(settings._buttonClasses.rowDrag);
                }
                */
                // Add hidden controls
                hiddenColumns.forEach(function (hi) {
                    // Prepare control ID / name
                    let hiddenName = settings.columns[hi].name;
                    let ctrlId = settings.idPrefix + '_' + hiddenName + '_' + uniqueIndex, ctrlName;
                    if (typeof (settings.nameFormatter) === 'function') {
                        ctrlName = settings.nameFormatter(settings.idPrefix, hiddenName, uniqueIndex);
                    } else {
                        ctrlName = ctrlId;
                    }
                    // Create hidden element
                    tbCell.appendChild(Util.createElem('input', ctrlId, ctrlName, null, 'hidden'));
                    // Assign value
                    if (loadData) {
                        // Load data if needed
                        self.setCtrlValue(hi, uniqueIndex, numOfRowOrRowArray[z][hiddenName]);
                    } else if (!Util.isEmpty(settings.columns[hi].value)) {
                        // Set default value
                        self.setCtrlValue(hi, uniqueIndex, settings.columns[hi].value);
                    }
                });

                // Add extra buttons
                /*
                if (settings.customRowButtons && settings.customRowButtons.length) {
                    // Add front buttons
                    for (var y = settings.customRowButtons.length - 1; y >= 0; y--) {
                        var buttonCfg = settings.customRowButtons[y];
                        if (buttonCfg && buttonCfg.uiButton && buttonCfg.click && buttonCfg.atTheFront) {
                            $(tbCell).prepend(makeCustomRowButton(tbWhole, buttonCfg, uniqueIndex));
                        }
                    }
                    // Add end buttons
                    for (var y = 0; y < settings.customRowButtons.length; y++) {
                        var buttonCfg = settings.customRowButtons[y];
                        if (buttonCfg && buttonCfg.uiButton && buttonCfg.click && !buttonCfg.atTheFront) {
                            $(tbCell).append(makeCustomRowButton(tbWhole, buttonCfg, uniqueIndex));
                        }
                    }
                }
                */
            }
            // Create sub panel
            /*
            if (settings.useSubPanel) {
                tbSubRow.appendChild(tbCell = document.createElement('td'));
                tbCell.className = 'ui-widget-content';
                tbCell.colSpan = settings._visibleCount + (settings._hideLastColumn ? 0 : 1);
                if ($.isFunction(settings.subPanelBuilder)) {
                    settings.subPanelBuilder(tbCell, uniqueIndex);
                }
            }
            */
        }
        // Check if re-calculate column width is required
        /*
        if (0 < settings.maxBodyHeight && this._calculateWidth && !calColWidth) {
            let scroll = $('#' + settings._wrapperId + '>div.scroller')[0];
            if (scroll.scrollHeight > scroll.offsetHeight) {
                calColWidth = true;
                settings._calculateWidth = false;
            }
        }
        */
        // Save setting
        // _state.set(self, state);

        if (!Util.isEmpty(rowIndex)) {
            self.sortSequence(rowIndex);
        }

        // Calculate column width
        /*
        if (calColWidth && settings.autoColumnWidth && settings.maxBodyHeight > 0) {
            calculateColumnWidth(document.getElementById(settings._wrapperId));
        }
        */
        // Trigger events
        /*
        if ($.isNumeric(rowIndex)) {
            if ($.isFunction(settings.afterRowInserted)) {
                settings.afterRowInserted(tbWhole, parentIndex, addedRows);
            }
        }
        else {
            if ($.isFunction(settings.afterRowAppended)) {
                settings.afterRowAppended(tbWhole, parentIndex, addedRows);
            }
        }
        if (reachMaxRow && $.isFunction(settings.maxNumRowsReached)) {
            settings.maxNumRowsReached();
        }
        */
        // Scroll the page when append row
        /*
        if (settings.maintainScroll && !$.isNumeric(rowIndex)) {
            // Try to maintain the height so that user no need to scroll every time when row added
            var newHeight = $(tbWhole).height();
            $(tbWhole).scrollParent().scrollTop(oldScroll + newHeight - oldHeight);
        }
        */
        // Return added rows' uniqueIndex
        return { addedRows: addedRows, parentIndex: parentIndex, rowIndex: rowIndex };
    }

    removeRow(rowIndex, uniqueIndex, force) {
        // Define variables
        let self = this;
        let settings = self.settings, tbWhole = self.tbWhole, tbBody = self.tbBody;
        if (Util.isNumeric(uniqueIndex)) {
            for (let z = 0; z < self.rowOrder.length; z++) {
                if (self.rowOrder[z] === uniqueIndex) {
                    rowIndex = z;
                    break;
                }
            }
        }
        if (Util.isNumeric(rowIndex)) {
            // Remove middle row
            if (force || typeof (settings.beforeRowRemove) !== 'function' || settings.beforeRowRemove(tbWhole, rowIndex)) {
                self.rowOrder.splice(rowIndex, 1);
                /*
                if (settings.useSubPanel) {
                    tbBody.removeChild(tbBody.childNodes[rowIndex * 2]);
                    tbBody.removeChild(tbBody.childNodes[rowIndex * 2]);
                } else {
                    tbBody.removeChild(tbBody.childNodes[rowIndex]);
                }
                */
                tbBody.removeChild(tbBody.childNodes[rowIndex]);
                // Save setting
                // _state.set(self, state);
                // Sort sequence
                self.sortSequence(rowIndex);
                // Trigger event
                /*
                if ($.isFunction(settings.afterRowRemoved)) {
                    settings.afterRowRemoved(tbWhole, rowIndex);
                }
                */
            }
        } else {
            // Store old window scroll value
            /*
            var oldHeight = 0, oldScroll = 0;
            if (settings.maintainScroll) {
                oldHeight = $(tbWhole).height();
                oldScroll = $(tbWhole).scrollParent().scrollTop();
            }
            */
            // Remove last row
            if (force || typeof (settings.beforeRowRemove) !== 'function' || settings.beforeRowRemove(tbWhole, self.rowOrder.length - 1)) {
                uniqueIndex = self.rowOrder.pop();
                tbBody.removeChild(tbBody.lastChild);
                /*
                if (settings.useSubPanel) {
                    tbBody.removeChild(tbBody.lastChild);
                }
                */
                // Save setting
                // _state.set(self, state);
                // Trigger event
                /*
                if ($.isFunction(settings.afterRowRemoved)) {
                    settings.afterRowRemoved(tbWhole, null);
                }
                */
            }
            // Scroll the page when append row
            /*
            if (settings.maintainScroll) {
                // Try to maintain the height so that user no need to scroll every time when row added
                var newHeight = $(tbWhole).height();
                $(tbWhole).scrollParent().scrollTop(oldScroll + newHeight - oldHeight);
            }
            */
        }
        // Add empty row
        /*
        if (settings._rowOrder.length == 0) {
            showEmptyMessage(document.getElementById(settings._wrapperId), settings);
        }
        */
    }

    moveUpRow(rowIndex, uniqueIndex) {
        let self = this, trAdtTarget, oldIndex = null;
        let settings = self.settings, tbBody = self.tbBody;
        if (Util.isNumeric(rowIndex) && rowIndex > 0 && rowIndex < self.rowOrder.length) {
            oldIndex = rowIndex;
            uniqueIndex = self.rowOrder[rowIndex];
        } else if (Util.isNumeric(uniqueIndex)) {
            oldIndex = self.findRowIndex(uniqueIndex);
        }
        if (!Util.isEmpty(oldIndex) && oldIndex > 0) {
            // Get row to swap
            let swapUniqueIndex = self.rowOrder[oldIndex - 1];
            let trTarget = document.getElementById(settings.idPrefix + '_Row_' + uniqueIndex);
            let trSwap = document.getElementById(settings.idPrefix + '_Row_' + swapUniqueIndex);
            // Get the sub panel row if used
            /*
            if (settings.useSubPanel) {
                trAdtTarget = document.getElementById(settings.idPrefix + '_SubRow_' + uniqueIndex, tbWhole);
            }
            */
            // Remove current row
            tbBody.removeChild(trTarget);
            /*
            if (settings.useSubPanel) {
                tbBody.removeChild(trAdtTarget);
            }
            */
            // Insert before the above row
            tbBody.insertBefore(trTarget, trSwap);
            /*
            if (settings.useSubPanel) {
                tbBody.insertBefore(trAdtTarget, trSwap);
            }
            */
            // Update rowOrder
            self.rowOrder[oldIndex] = swapUniqueIndex;
            self.rowOrder[oldIndex - 1] = uniqueIndex;
            // Update row label
            let targetRowNumCell = document.getElementById(settings.idPrefix + '_RowNum_' + uniqueIndex);
            let swapRowNumCell = document.getElementById(settings.idPrefix + '_RowNum_' + swapUniqueIndex);
            let swapSeq = swapRowNumCell.innerHTML;
            swapRowNumCell.innerHTML = targetRowNumCell.innerHTML;
            targetRowNumCell.innerHTML = swapSeq;
            // Save setting
            // saveSetting(tbWhole, settings);
            // Change focus
            document.getElementById(settings.idPrefix + '_moveUp_' + uniqueIndex).blur();
            document.getElementById(settings.idPrefix + '_moveUp_' + swapUniqueIndex).focus();
            // Trigger event
            /*
            if (settings.afterRowSwapped) {
                settings.afterRowSwapped(tbWhole, oldIndex, oldIndex - 1);
            }
            */
        }
    }

    moveDownRow(rowIndex, uniqueIndex) {
        let self = this, trAdtTarget, oldIndex = null;
        let settings = self.settings, tbBody = self.tbBody;
        if (Util.isNumeric(rowIndex) && rowIndex >= 0 && rowIndex < self.rowOrder.length - 1) {
            oldIndex = rowIndex;
            uniqueIndex = self.rowOrder[rowIndex];
        } else if (Util.isNumeric(uniqueIndex)) {
            oldIndex = self.findRowIndex(uniqueIndex);
        }
        if (!Util.isEmpty(oldIndex) && oldIndex !== self.rowOrder.length - 1) {
            // Get row to swap
            let swapUniqueIndex = self.rowOrder[oldIndex + 1];
            let trTarget = document.getElementById(settings.idPrefix + '_Row_' + uniqueIndex);
            let trSwap = document.getElementById(settings.idPrefix + '_Row_' + swapUniqueIndex);
            // Get the sub panel row if used
            /*
            if (settings.useSubPanel) {
                trAdtSwap = document.getElementById(settings.idPrefix + '_SubRow_' + settings._rowOrder[oldIndex + 1], tbWhole);
            }
            */
            // Remove current row
            tbBody.removeChild(trSwap);
            // Insert before the above row
            tbBody.insertBefore(trSwap, trTarget);
            /*
            if (settings.useSubPanel) {
                tbBody.insertBefore(trAdtSwap, trTarget);
            }
            */
            // Update rowOrder
            self.rowOrder[oldIndex] = swapUniqueIndex;
            self.rowOrder[oldIndex + 1] = uniqueIndex;
            // Update row label
            let targetRowNumCell = document.getElementById(settings.idPrefix + '_RowNum_' + uniqueIndex);
            let swapRowNumCell = document.getElementById(settings.idPrefix + '_RowNum_' + swapUniqueIndex);
            let swapSeq = swapRowNumCell.innerHTML;
            swapRowNumCell.innerHTML = targetRowNumCell.innerHTML;
            targetRowNumCell.innerHTML = swapSeq;
            // Save setting
            // saveSetting(tbWhole, settings);
            // Change focus
            document.getElementById(settings.idPrefix + '_moveDown_' + uniqueIndex).blur();
            document.getElementById(settings.idPrefix + '_moveDown_' + swapUniqueIndex).focus();
            // Trigger event
            /*
            if (settings.afterRowSwapped) {
                settings.afterRowSwapped(tbWhole, oldIndex, oldIndex + 1);
            }
            */
        }
    }

    setCtrlValue(colIndex, uniqueIndex, data) {
        let self = this;
        let settings = self.settings,
            type = settings.columns[colIndex].type,
            columnName = settings.columns[colIndex].name;
        // Handle values by type
        if (type === 'custom') {
            if (typeof (settings.columns[colIndex].customSetter) === 'function') {
                settings.columns[colIndex].customSetter(settings.idPrefix, columnName, uniqueIndex, data);
            } else {
                // `customSetter` is not a function?? Skip handling...
            }
        } else {
            let element = self.getCellCtrl(type, settings.idPrefix, columnName, uniqueIndex);
            if (type === 'checkbox') {
                element.checked = (data !== null && data !== 0);
            }
            else {
                element.value = data || '';
            }
        }
    }

    getCellCtrl(type, idPrefix, columnName, uniqueIndex) {
        return document.getElementById(idPrefix + '_' + columnName + '_' + uniqueIndex);
    }

    getCtrlValue(colIndex, uniqueIndex) {
        const self = this;
        const settings = self.settings;
        const column = settings.columns[colIndex];
        // let type = self.settings.columns[colIndex].type, columnName = settings.columns[colIndex].name;
        if (column.type === 'custom') {
            if (typeof (column.customGetter) === 'function') {
                return column.customGetter(settings.idPrefix, column.name, uniqueIndex);
            } else {
                // customGetter is not defined
                throw `*customGetter* of column *${column.name}* is not defined.`;
            }
        } else {
            let ctrl = self.getCellCtrl(column.type, settings.idPrefix, column.name, uniqueIndex);
            if (ctrl === null) {
                return null;
            }
            else if (column.type === 'checkbox') {
                return ctrl.checked ? 1 : 0;
            } else {
                return ctrl.value;
            }
        }
    }

    getRowValue(uniqueIndex, loopIndex) {
        let self = this;
        let result = {}, suffix = (Util.isEmpty(loopIndex) ? '' : '_' + loopIndex);
        self.settings.columns.forEach(function (column, colIndex) {
            let keyName = column.name + suffix;
            result[keyName] = self.getCtrlValue(colIndex, uniqueIndex);
        });
        // Merge control values from sub panel if getter method defined
        /*
        if (settings.useSubPanel && $.isFunction(settings.subPanelGetter)) {
            var adtData = settings.subPanelGetter(uniqueIndex);
            if ($.isPlainObject(adtData)) {
                if (suffix == '') {
                    // Extend to row data directly for array mode
                    $.extend(result, adtData);
                } else {
                    // For returning values in object mode, add suffix to all keys
                    var newData = {};
                    for (var key in adtData) {
                        newData[key + suffix] = adtData[key];
                    }
                    $.extend(result, newData);
                }
            }
        }
        */
        return result;
    }

    findRowIndex(uniqueIndex) {
        for (let z = 0; z < this.rowOrder.length; z++) {
            if (this.rowOrder[z] === uniqueIndex) {
                return z;
            }
        }
        return null;
    }

    /**
     * Update the row number displayed in the front of each row.
     * @param {*} startIndex 
     */
    sortSequence(startIndex) {
        let self = this;
        if (!self.settings.hideRowNumColumn) {
            for (let z = startIndex || 0; z < self.rowOrder.length; z++) {
                document.getElementById(self.settings.idPrefix + '_RowNum_' + self.rowOrder[z])
                    .innerText = '' + (z + 1);
            }
        }
    }

    rowButtonActions(type, uniqueIndex) {
        let self = this;
        if (type === 'insert') {
            self.insertRow(1, null, uniqueIndex);
        } else if (type === 'remove') {
            self.removeRow(null, uniqueIndex);
        } else if (type === 'moveUp') {
            self.moveUpRow(null, uniqueIndex);
        } else if (type === 'moveDown') {
            self.moveDownRow(null, uniqueIndex);
        }
    }
}

export default GridCore;
