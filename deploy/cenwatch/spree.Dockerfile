ARG SPREE_VERSION_TAG=5.5.2
FROM ghcr.io/spree/spree:${SPREE_VERSION_TAG}

# Keep the official stable image pinned and add only CenWatch deployment
# initializers. This avoids adopting unrelated unreleased Spree changes.
COPY deploy/cenwatch/overrides/cenwatch_locale_isolation.rb /rails/config/initializers/cenwatch_locale_isolation.rb
COPY deploy/cenwatch/overrides/cenwatch_public_media.rb /rails/config/initializers/cenwatch_public_media.rb
# One-off rails runner scripts must stay outside /rails/lib: Rails production
# eager loading treats that directory as a Zeitwerk namespace and would execute
# these scripts while booting Puma.
COPY deploy/cenwatch/scripts /rails/cenwatch-scripts
