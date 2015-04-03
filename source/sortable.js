/*jshint undef: false, unused: false, indent: 2*/
/*global angular: false */

(function () {

  'use strict';
  var mainModule = angular.module('ui.sortable');

  /**
   * Controller for Sortable.
   * @param $scope - the sortable scope.
   */
  mainModule.controller('ui.sortable.sortableController', ['$scope', function ($scope) {

    this.scope = $scope;

    $scope.modelValue = null; // sortable list.
    $scope.type = 'sortable';
    $scope.options = {};
    $scope.isDisabled = false;

    /**
     * Checks whether the sortable list is empty.
     *
     * @returns {null|*|$scope.modelValue|boolean}
     */
    $scope.isEmpty = function () {
      return ($scope.modelValue && $scope.modelValue.length === 0);
    };

    /**
     * Wrapper for the accept callback delegates to callback.
     *
     * @param sourceItemHandleScope - drag item handle scope.
     * @param destScope - sortable target scope.
     * @param destItemScope - sortable destination item scope.
     * @returns {*|boolean} - true if drop is allowed for the drag item in drop target.
     */
    $scope.accept = function (sourceItemHandleScope, destScope, destItemScope) {
      return $scope.callbacks.accept(sourceItemHandleScope, destScope, destItemScope);
    };

  }]);

  /**
   * Sortable directive - defines callbacks.
   * Parent directive for draggable and sortable items.
   * Sets modelValue, callbacks, element in scope.
   */
  mainModule.directive('asSortable', function () {

      function sortableLink(scope, element, attrs, ngModel) {

        /**
         * ngModel handlers
         */
        function reordered(event, info) {
          var newCollection = angular.copy(ngModel.$viewValue),
              replacedItem = newCollection[info.source.index];

          newCollection.splice(info.source.index, 1);
          newCollection.splice(info.dest.index, 0, replacedItem);

          setModelValue(newCollection);
        }
        function moved(event, info) {
          var newCollection = angular.copy(ngModel.$viewValue),
              movedItem = newCollection[info.source.index];

          // Item is always removed from ownCollection
          newCollection.splice(info.source.index, 1);

          info.dest.sortableScope.$emit('itemInserted', {
            index: info.dest.index,
            item: movedItem
          });

          setModelValue(newCollection);
        }
        function inserted(event, info) {
          var newCollection = angular.copy(ngModel.$viewValue);

          newCollection.splice(info.index, 0, info.item);
          setModelValue(newCollection);
        }
        function setModelValue(value) {
          ngModel.$setViewValue(value);
        }
        function ngModelRender() {
          //set an empty array, in case if none is provided.
          if (!ngModel.$modelValue || !angular.isArray(ngModel.$modelValue)) {
            ngModel.$setViewValue([]);
          }
          scope.modelValue = ngModel.$modelValue;
        }

        /**
         * Attributes
         */
        function updateDisabled(disabledState) {
          if(!angular.isUndefined(disabledState)) {
            scope.isDisabled = disabledState;
          }
        }
        function updateOptions(options) {
          angular.forEach(options, function setOption(value, key) {
            if (callbacks[key] && typeof value === 'function') {
              callbacks[key] = value;
            } else {
              scope.options[key] = value;
            }
          });
          scope.callbacks = callbacks;
        }

        var callbacks = {};

        // Update currently is called from controller
        // ideally should be done here
        scope.ngModel = ngModel;

        // @TODO Subscribe to DragEnd event from here
        scope.setModelValue = setModelValue;

        // Set the model value in to scope.
        ngModel.$render = ngModelRender;

        // Set the element in scope to be accessed by its sub scope.
        scope.element = element;

        scope.$on('orderChanged', reordered);
        scope.$on('itemMoved', moved);
        scope.$on('itemInserted', inserted);

        /**
         * @TODO cut those callbacks if favor of scope events
         */

        /**
         * Invoked to decide whether to allow drop.
         *
         * @param sourceItemHandleScope - the drag item handle scope.
         * @param destSortableScope - the drop target sortable scope.
         * @param destItemScope - the drop target item scope.
         * @returns {boolean} - true if allowed for drop.
         */
        callbacks.accept = function accept(sourceItemHandleScope, destSortableScope, destItemScope) {
          return true;
        };

        // Set the sortOptions callbacks else set it to default.
        // NOTE: get rid of deep watch
        scope.$watch(attrs.asSortable, updateOptions, true);

        // Set isDisabled if attr is set, if undefined isDisabled = false
        if(angular.isDefined(attrs.disabled)) {
          scope.$watch(attrs.disabled, updateDisabled);
        }
      }
      
      return {
        require: 'ngModel',
        restrict: 'A',
        scope: true,
        controller: 'ui.sortable.sortableController',
        link: sortableLink
      };
      
    });

}());
