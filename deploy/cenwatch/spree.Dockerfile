ARG SPREE_VERSION_TAG=5.4.3.1
FROM ghcr.io/spree/spree:${SPREE_VERSION_TAG}

# Keep the upstream image pinned and add only CenWatch's locale isolation
# backport. This avoids adopting unrelated unreleased Spree changes.
COPY deploy/cenwatch/overrides/cenwatch_locale_isolation.rb /rails/config/initializers/cenwatch_locale_isolation.rb
COPY deploy/cenwatch/scripts /rails/lib/cenwatch
