import { defineComponent, h, VNodeChild, onMounted, onUnmounted, inject, watch, cloneVNode, ref, nextTick } from 'vue';
import { ANCHOR_SHARP_REGEXP } from './utils';
import props from './anchor-item-props';
import { usePrefixClass, useCommonClassName } from '../hooks/useConfig';
import { AnchorInjectionKey } from './constants';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';

const localProps = {
  ...props,
  href: {
    type: String,
    required: true,
    validator(v: string): boolean {
      return ANCHOR_SHARP_REGEXP.test(v);
    },
  },
  _level: {
    type: Number,
    default: 1,
  },
};

export default defineComponent({
  name: 'TAnchorItem',
  inject: {
    tAnchor: { default: undefined },
  },
  props: localProps,
  setup(props, { slots }) {
    const elRef = ref<HTMLElement>(null);
    const anchor = inject(AnchorInjectionKey, undefined);
    const CLASSNAME_PREFIX = usePrefixClass('anchor__item');
    const { STATUS } = useCommonClassName();
    const register = () => {
      anchor.registerLink(props.href as string);
    };
    const unregister = () => {
      const { href } = props;
      if (!href) return;
      anchor.unregisterLink(href);
    };
    const handleClick = (e: MouseEvent) => {
      const { href, title } = props;
      anchor.handleLinkClick({ href, title: isString(title) ? title : undefined, e });
    };
    const renderTitle = () => {
      const { title } = props;
      const { title: titleSlot } = slots;
      let titleVal: VNodeChild;
      if (isString(title)) {
        titleVal = title;
      } else if (isFunction(title)) {
        titleVal = title(h);
      } else if (titleSlot) {
        titleVal = titleSlot(null);
      }
      return titleVal;
    };
    watch(
      () => props.href,
      () => {
        unregister();
        register();
      },
      { immediate: true },
    );
    onMounted(async () => {
      register();
      await nextTick();
      elRef.value.style.setProperty('--level', `${props._level}`);
    });
    onUnmounted(() => {
      unregister();
    });
    return () => {
      const { href, target } = props;
      const { default: children, title: titleSlot } = slots;
      const title = renderTitle();
      const titleAttr = isString(title) ? title : null;
      const active = anchor.active === href;
      const wrapperClass = {
        [CLASSNAME_PREFIX.value]: true,
        [STATUS.value.active]: active,
      };
      const titleClass = {
        [`${CLASSNAME_PREFIX.value}-link`]: true,
      };
      return (
        <>
          <div class={wrapperClass} ref={elRef}>
            <a href={href} title={titleAttr} class={titleClass} target={target} onClick={handleClick}>
              {titleSlot ? titleSlot(null) : title}
            </a>
          </div>
          {children &&
            children(null).map((child) =>
              cloneVNode(child, {
                _level: props._level + 1,
              }),
            )}
        </>
      );
    };
  },
});
